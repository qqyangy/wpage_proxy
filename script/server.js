
const http=require("http"),
request = require("request"),
path=require("path"),
url=require("url"),
plugins=require("./plugins.js"),
utils=require("./utils.js"),
mimes=require("./mime.config.js"),
{MyWriteStream}=require("./MyStream.js");

const index=process.argv[2] || 0; // 获取配置索引

let {configall,confgs,content}=utils.formatConfig(),//读取配置
confg=confgs[index];//获取当前配置
const defaultlocalPort=configall.localPort||9200,//全局默认端口
localIp=utils.getIPAddress(),//获取本机ip
weinrePort=utils.weinrePort(configall),
weinreHost=weinrePort?`http://${localIp}:${weinrePort}/target/target-script-min.js#anonymous`:"",
hosts=confgs.map((o,i)=>{
  const domain=url.parse(o.server||"http:localhost:3001"),
  {port="",hostname=""}=domain,
  protocol=(domain.protocol||"http").replace(":",""),
  localPort=o.localPort||(defaultlocalPort+Number(i));//服务端
  return {
    protocol,
    hostname,
    port,
    host:port?`${protocol}://${hostname}:${port}`:`${protocol}://${hostname}`,
    localIp,
    localPort
  };
}),
{port,hostname,protocol,localPort}=hosts[index];// 获取对饮篇日志
confg.server=utils.formatServer(confg.server);//删除最后斜杠
//监听配置文件变化并热更新
utils.watchConfig(o=>{
  //更新篇日志
  configall=o.configall;
  confgs=o.confgs;
  confg=confgs.find(o=>utils.formatServer(o.server)===utils.formatServer(confg.server) && o.localPort===confg.localPort)||confg;
  confg.server=utils.formatServer(confg.server);//删除最后斜杠
  console.log("配置更新成功");
}).content=content;

// 生成处理响应数据函数
const configHandlerPickUp=(headers,req,resConfig,env,bodyfile="")=>{
  if(!headers["content-type"]){
    const ext=utils.getExt(bodyfile)||utils.getExt(req.url),// 获取文件后缀
    vcontent=ext&&mimes[ext]||index==0&&"text/html; charset=UTF-8";
    vcontent&&(headers["content-type"]=vcontent); //处理默认contentType
  }
  headers=utils.deletekey(headers,["content-security-policy","content-encoding","content-length"]);//删除csp限制
  headers=utils.deletekey(headers,["last-modified","etag"]);//删除缓存相关
  headers=utils.deletekey(headers,["access-control-allow-origin","access-control-allow-methods","access-control-allow-headers","access-control-allow-credentials"]);//删除已统一配置的key
  const istextHtml=(headers["content-type"]||"").includes("text/html");
  if(confg.setCookie&&istextHtml&&confg.cookie){
    headers=utils.deletekey(headers,["Set-Cookie"]);
    headers["set-cookie"]=confg.cookie.split(";").map(t=>t.trim());//是否需要在前端种植cookie
  }
  env.contentType=headers["content-type"]||"";//设置content-type

  const aftersource=[!confg.disableWeinre&&weinreHost].filter(t=>t);//需要最后处理插入的js资源
  const beforfuncs=[istextHtml&&confg.scripts&&plugins.addScripts.bind(plugins,confg.scripts),confg.module&&plugins.moduleCode,confg.proxyLocation&&plugins.relocation],
  afterfunc=[
    istextHtml&&plugins.insertInnerScript,//注入基础脚本
    istextHtml&&aftersource.length>0&&plugins.insertScriptSrcs.bind(plugins,aftersource)//注入外部js
  ],
  filters=beforfuncs.concat(resConfig.resultfuncs).concat(afterfunc).filter(f=>f&&typeof f==="function");
  // 加工响应数据
  return utils.textcontent(headers,env,filters);
}

const corsHeader={
  'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Referer, Accept-Language, Connection, Pragma, Authorization, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, X-Requested-By, If-Modified-Since, X-File-Name, X-File-Type, Cache-Control, Origin,*',
  // "Access-Control-Expose-Headers": "Authorization",
  "Access-Control-Allow-Credentials":"true"
};

http.createServer((req,res)=>{
  req.headers.origin&&Object.assign(corsHeader,{"Access-Control-Allow-Origin":req.headers.origin});//允许对当前域跨域
  if(localPort>9000){
    console.log("1111--",req.method,corsHeader);
  }
  if (req.method == 'OPTIONS') {
    res.writeHead(204,corsHeader);
    return res.end();
  }
  if(localPort>9000){
    console.log("2222");
  }
  const options={
    type:protocol,
    host:hostname,
    port,
    path:req.url,
    url:`${protocol}://${hostname}${port?`:${port}`:""}${req.url}`
  };
  const urlParse=url.parse(options.url),
  urlParsepick=["protocol","hostname","pathname","hash","query"].reduce((o,k)=>(o[k]=urlParse[k]||"",o),{});
  urlParsepick.query_o=urlParsepick.query.split("&").reduce((o,s)=>{
    const pair=s.split("=");
    return o[pair[0]]=pair[1]||"",o;
  },{});
  //定制环境数据
  const env={
    ...urlParsepick,
    keepInsert:!!confg.keepInsert,
    url:options.url,
    // ourl:hosts[index].host+req.url,
    path:req.url,
    proxyLocation:confg.proxyLocation,
    mapUrl:(v=>{
      return v && v instanceof Array && (v.length>0 && !(v[0] instanceof Array)?[v]:v) || [];
    })(configall.mapUrl).filter(a=>a.length>1).map(a=>a.length>3?a.splice(0,3):a),
    origin:hosts[index].host,
    norigin:(t=>{
      return utils.urlformat(t,"http",localPort);
    })(req.headers.origin?req.headers.origin:(req.headers.host||"localhost:3001")),
    localIp,
    nhostname:url.parse(utils.urlformat(req.headers.host||req.headers.origin)).hostname,
    hosts,
    tools:utils.tools
  };
  env.nurl=env.norigin+req.url;//新的url



  const resConfig=utils.extractTrans(configall,confg,env)//获取配置中res项
  if(resConfig.mock){
    const reshead=Object.assign({},corsHeader);
    const execcontent=configHandlerPickUp(reshead,req,resConfig,env,resConfig.res.bodyFile);
    const resultdata=execcontent(resConfig.res.body);
    resConfig.res.body=resultdata.body;
    return utils.resMock({req,res,resConfig,reshead}); // 处理mock结果
  }
  nhost=port?hostname+":"+port:hostname,
  headers=Object.assign(utils.deletekey(req.headers,["accept-encoding","if-none-match","if-modified-since","cache-control"]),{
    host:nhost,
    referer:(req.headers.referer||"").replace(req.headers.host,nhost)
  })
  if(confg.cookie){
    headers.cookie=confg.cookie; //有配置cookie时代理cookie
  }
 
  const reqOptionsInit={
    ...options,
    headers,
    method: req.method
  };
  const reqConfig=utils.extractTrans(configall,confg,env,"req")//获取配置中req项
  const {reqStream,reqPromise}=utils.reqFilter(reqOptionsInit,reqConfig,env);
  req.pipe(reqStream);
  reqPromise.then(({optins:reqOptions,data:reqdata})=>{
    const resStream=new MyWriteStream();//响应数据中转流
    if(localPort>9000){
      console.log(">>>>>>>1111",env.path);
    }
    // 发起请求
    const reqs2=request(reqOptions,(err,res2)=>{
      if(localPort>9000){
        console.log(">>>>>>>");
      }
      const _res2=res2||{};
      if(err || !_res2.statusCode || _res2.statusCode >= 500){
        res.writeHead(_res2.statusCode||500,_res2.headers||{});
        return _res2.statusCode?resStream.then(d=>res.end(d)):res.end("服务器错误");
      }
      let headers=res2.headers;
       // 加工响应数据
      const execcontent=configHandlerPickUp(headers,req,resConfig,env);
      resStream.then(d=>{
        const resultdata=execcontent(d);
        res.writeHead(resultdata.statusCode||res.statusCode||200,Object.assign(headers,resultdata.headers,corsHeader));
        res.end(resultdata.body);
      });
    });
    reqs2.pipe(resStream);
    reqs2.end(reqdata);
  })

}).listen(localPort);

console.log("服务启动=>",confg.server,"=>",`http://${localIp}:${localPort}`);