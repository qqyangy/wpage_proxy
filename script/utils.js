const path=require("path"),
fs=require("fs"),
url=require("url"),
child_process=require("child_process"),
{MyWriteStream}=require("./MyStream.js");
// 获取正确的headers格式
const getObject=(d,env)=>{
  const rd=typeof d === "function"?d(env):d;
  return rd&&rd.constructor===Object?rd:undefined;
},
// 获取正确的body数据
getBodyData=(d,env)=>{
  return typeof d === "function"?d(env):d
},
// 对象赋值
setValue=(target,obj={},keys=[])=>{
  target&&keys.forEach(k=>{
    if(target && k in obj){
      target[k]=obj[k];
    }
  })
},
// 判断是否具备指定key
iskeys=(obj={},keys=[])=>keys.some(k=>k in obj),
//发送数据
textcontent=(h,env,fncs)=>{
  const iscode=/text|javascript|json/.test(h["content-type"]);
  return (data)=>{
      let result={body:data,headers:Object.assign({},h)};
      if(iscode && fncs.length>0){
        fncs.forEach(f=>{
          const rdata=Buffer.isBuffer(result.body)?result.body.toString():result.body;
          const d=f.call(result,rdata,result.headers,Object.assign({},env));
          if(d!==undefined){
            result.body=d;
          }
        });
        // 标准化响应体
        ({
          object:()=>result.body=JSON.stringify(result.body),
          function:()=>result.body=result.body.toString()
        }[result.body && (typeof result.body)]||(()=>{}))();
        !(result.headers&&result.headers.constructor===Object)&&(result.headers={});//如果headers不是对象则重置为空对象
      }
      return result;
  }
},
//删除指定key
deletekey=(o={},ks=[])=>{
  ks.forEach(k=>{
    if(Object.prototype.hasOwnProperty.call(o,k)){
      delete o[k];
    }
  })
  return o;
},
// 处理bodyFile配置
setBodyFile=(target)=>{
  if(target.constructor===Object && target.bodyFile){
    const isNetSource=/^https?:\/\/\w+(?:\.[^.]+)+/.test(target.bodyFile)
    if(isNetSource){
      target.body=child_process.execSync(`curl ${target.bodyFile}`); //网络资源数据
      return target;
    }
    const pt=path.resolve(process.cwd(),target.bodyFile);
    if(!fs.existsSync(pt)){
      console.log(`指定的bodyFile：${target.bodyFile} 不存在!`);
    }else{
      target.body=fs.readFileSync(pt); // 本机文件数据
    }
  }
  return target;
},
// 合并生成请求头
mergeReqOptions=(optins,reqdt)=>{
  const mkeys=["method"];//可直接合并的key
  const isUrl=iskeys(reqdt,["path","query","hash"]),
  isMkeys=iskeys(reqdt,mkeys),
  isheaders=reqdt.headers&&reqdt.headers.constructor===Object;
  if(!isUrl && !isMkeys && !isheaders){
    return optins; // 无任何需要变更时
  }
  const nOptins=Object.assign({},optins);
  // 处理url相关
  if(isUrl){
    const ourl=url.parse(optins.url);
    reqdt.path&&(ourl.pathname=reqdt.path.replace(/^./,t=>t==="/"?t:`/${t}`));
    reqdt.query&&(ourl.search=reqdt.query.replace(/^./,t=>t==="?"?t:`?${t}`));
    reqdt.hash&&(ourl.hash=reqdt.hash.replace(/^#/,""));
    optins.path=ourl.pathname+ourl.search+(reqdt.hash?`#${reqdt.hash}`:"");
    optins.url=url.format(ourl);
  }
  // 处理method
  reqdt.method&&(optins.method=/(?:get|post|head|put|delete)/i.test(reqdt.method)?reqdt.method.toUpperCase():optins.method);
  // 处理可直接合并的属性
  isMkeys && mkeys.forEach(k=>(nOptins[k]=reqdt[k]));
  // 处理请求头信息
  if(isheaders){
    nOptins.headers=Object.assign({},nOptins.headers,reqdt.headers)
  }
},
// 获取本机ip
getIPAddress=()=>{
  if(getIPAddress.ip) return getIPAddress.ip;
  var interfaces = require('os').networkInterfaces();
  for(var devName in interfaces){
      var iface = interfaces[devName];
      for(var i=0;i<iface.length;i++){
          var alias = iface[i];
          if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
              return getIPAddress.ip=alias.address;
          }
      }
  }
  return getIPAddress.ip="localhost";
};

const configkeys=["path","query","hash","method","bodyFile","statusCode"];//需要统一处理的配置项
// 格式化 res 和 req配置为函数
function formatResCfg(res,url,results,env){
  return ({
    "[object Function]":()=>results.push(res),
    "[object Array]":()=>res.forEach(o=>formatResCfg(o,url,results,env)),
    "[object Object]":()=>{
      if("test" in res){
        const type=Object.prototype.toString.call(res.test),
        sTest=type==="[object String]" && url.includes(res.test),
        rTest=type==="[object RegExp]" && res.test.test(url);
        if(!sTest && !rTest) return;//有test且验证不通过
      }
      const headers=res.headers&&(res.headers.constructor===Object||res.headers.constructor===Function)&&res.headers; //获取配置的headers
      switch(true){
        case iskeys(res,["body","bodyFile"]):
          // 需要使用mock数据
          results.mockIndex=results.length;
          return results.push(function(){
            setValue(this,res,configkeys);
            headers&&(this.headers=getObject(headers,env));//判断是否需要设置headers
            if(res.bodyFile){
              setBodyFile(this,res.bodyFile)
            }else{
              this.body=getBodyData(res.body,env)
            }
            return this.body;
          });
        case res.handler && res.handler.constructor===Function:
           // 使用handler处理
          return results.push(headers?function(...p){
              setValue(this,res,configkeys);
              this.headers=getObject(headers,env);
              return res.handler.call(this,...p);
          }:res.handler);
        case headers:
          // 只有headers时生成处理函数
          return  results.push(function(){
              setValue(this,res,configkeys);
              this.headers=getObject(headers,env);
          })
        case iskeys(res,configkeys):
          // 处理 path、query
          return  results.push(function(){
              setValue(this,res,configkeys);
          })
      }
    }
  }[Object.prototype.toString.call(res)]||(()=>{}))()
}
module.exports={
  textcontent,
  deletekey,
  getIPAddress,
  // 格式化url
  urlformat(url="",protocol="http",prot=""){
    const httpreg=/^https?:\/\//,
    protreg=/:\d+$/;
    if(!httpreg.test(url)){
      url=`${protocol}://${url}`
    }else{
      url=url.replace(httpreg,`${protocol}://`);
    }
    if(prot){
      if(!protreg.test(url)){
        url=`${url}:${prot}`
      }else{
        url=url.replace(/:\d+$/,prot);
      }
    }
    return url;;
  },
  // 提取res 与 req配置
  extractTrans(pcfg,cfg,env,key="res"){
    const url=env.url;
    const resultfuncs=[];
    formatResCfg(pcfg[key],url,resultfuncs,env); // 处理根配置
    formatResCfg(cfg[key],url,resultfuncs,env); // 处理对应域配置
    const mock="mockIndex" in resultfuncs;//是否为mock类型
    const target={};
    return {
      mock,
      [key]:mock && key==="res"?resultfuncs[resultfuncs.mockIndex].call(target)&&target:resultfuncs
    }
  },
  // 处理响应mock数据方法
  resMock({req,res,resConfig,corsHeader}){
    const defaultContent=(t=>t.includes("charset")?t:`${t}; charset=utf-8`)((req.headers.accept||"").split(",").map(t=>t.trim())[0]||"text/plan"),
    body=resConfig.res.body,
    isJson=!Buffer.isBuffer(resConfig.res.body) && typeof body === 'object';
    res.writeHead(resConfig.res.statusCode||200,Object.assign({"content-type":isJson?"application/json; charset=UTF-8":defaultContent},resConfig.res.headers||{},corsHeader));
    res.end(isJson?JSON.stringify(body):body);
  },
  // 按照配置处理加工 请求相关数据
  reqFilter(optins,config,env){
    let resolve;
    const reqStream=new MyWriteStream(),
    reqPromise=new Promise(r=>(resolve=r));
    const result={reqStream,reqPromise};
    if(config.req.length===0){
      reqStream.then(d=>{
        resolve({optins,data:d});
      });
      return result;
    }
    const headers=Object.assign({},optins.headers),
    noptions=Object.assign({},optins);
    reqStream.then(d=>{
      const purl=url.parse(optins.url);
      const target={headers,body:d,path:purl.pathname,query:purl.search,hash:purl.hash,method:optins.method};
      config.req.forEach(fus=>{
        const rdt=fus.call(target,target.body,Object.assign({},headers),Object.assign({},env));//调用函数并获得返回值
        target.body=rdt!==undefined?rdt:target.body;
      })
      // 处理参数为对象的形式
      if(target.query && target.query.constructor === Object){
        target.query=Object.keys((r,k)=>{
          return (t=>r?`&${r}${t}`:t)(`${k}=${target.query[k]}`);
        },"");
      }
      // 处理返回数据为非字符串和非buffer时的转换
      if(target.body && !Buffer.isBuffer(target.body) && typeof target !=="string"){
        if(target.body instanceof Object){
          target.body=JSON.stringify(target.body);
        }else if(target.body.toString){
          target.body=target.body.toString();
        }
      }
      mergeReqOptions(noptions,target);//合并结果
      resolve({optins:noptions,data:target.body});
    })
    return result;
  }
}