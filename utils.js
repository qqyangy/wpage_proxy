const path=require("path"),
fs=require("fs");
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
// 处理bodyFile配置
setBodyFile=(target)=>{
  if(target.constructor===Object && target.bodyFile){
    const pt=path.resolve(process.cwd(),target.bodyFile);
    if(!fs.existsSync(pt)){
      console.log(`指定的bodyFile：${target.bodyFile} 不存在!`);
    }else{
      target.body=fs.readFileSync(pt);
    }
  }
  return target;
}

const configkeys=["path","query","method","bodyFile","statusCode"];//需要统一处理的配置项
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
            return this.body=getBodyData(res.body,env);
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
  // 格式化url
  urlfromat(url="",protocol="http",prot=""){
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
    return {
      mock,
      [key]:mock?resultfuncs[resultfuncs.mockIndex].call({}):resultfuncs
    }
  }
}