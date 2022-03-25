
const http=require("http"),
request = require("request"),
path=require("path"),
url=require("url"),
plugins=require("./plugins.js"),
utils=require("./utils.js"),
mimes=require("./mime.config.js"),
{MyWriteStream}=require("./MyStream.js");


const index=process.argv[2] || 0, // 获取配置索引
configall=require(path.resolve(process.cwd(),"./proxy.config.js")),
defaultlocalPort=configall.localPort||9200,
confgs=(d=>d instanceof Array?d:[d])(configall.proxy).filter(o=>o.server).map(o=>(!/^\w+:\/\//.test(o.server)&&(o.server='http://'+o.server),o)); //获取全部配置
//配置可继承属性
["cookie","module","proxyLocation","keepInsert"].forEach(k=>{
  configall.hasOwnProperty(k) && confgs.forEach(o=>{
    !o.hasOwnProperty(k) && (o[k]=configall[k]);
  })
})
const confg=confgs[index],//获取当前配置
localIp=utils.getIPAddress(),//获取本机ip
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


const corsHeader={
  'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Referer, Accept-Language, Connection, Pragma, Authorization, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, X-Requested-By, If-Modified-Since, X-File-Name, X-File-Type, Cache-Control, Origin',
  // "Access-Control-Expose-Headers": "Authorization",
  "Access-Control-Allow-Credentials":"true"
};



http.createServer((req,res)=>{
  req.headers.origin&&Object.assign(corsHeader,{"Access-Control-Allow-Origin":req.headers.origin});//允许对当前域跨域
  if (req.method == 'OPTIONS') {
    res.writeHead(204,corsHeader);
    return res.end();
  }
  const options={
    type:protocol,
    host:hostname,
    port,
    path:req.url,
    url:`${protocol}://${hostname}${port?`:${port}`:""}${req.url}`
  };
  //定制环境数据
  const env={
    keepInsert:!!confg.keepInsert,
    url:options.url,
    ourl:hosts[index].host+req.url,
    path:req.url,
    proxyLocation:confg.proxyLocation,
    mapUrl:(v=>{
      return v && v instanceof Array && (v.length>0 && !(v[0] instanceof Array)?[v]:v) || [];
    })(configall.mapUrl).filter(a=>a.length>1).map(a=>a.length>3?a.splice(0,3):a),
    oldOrigin:hosts[index].host,
    newOrigin:(t=>{
      return utils.urlformat(t,"http",localPort);
    })(req.headers.origin?req.headers.origin:(req.headers.host||"localhost:3001")),
    localIp,
    hostName:url.parse(utils.urlformat(req.headers.host||req.headers.origin)).hostname,
    hosts
  };

  const resConfig=utils.extractTrans(configall,confg,env)//获取配置中res项
  if(resConfig.mock){
    return utils.resMock({req,res,resConfig,corsHeader}); // 处理mock结果
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
    // 发起请求
    const reqs2=request(reqOptions,(err,res2)=>{
      if(err || res2 && res2.statusCode >= 500){
        res.writeHead((!err&&res2 && res2.statusCode)||500,{});
        return res.end(err&&err.toString&&err.toString()||res2&&res2.statusCode);
      }
      let headers=res2.headers;
      if(!headers["content-type"]){
        const ext=(/\.\w+$/.exec(req.url.split("?")[0].split("#")[0])||[""])[0].replace(".",""),// 获取文件后缀
        vcontent=ext&&mimes[ext]||index==0&&"text/html; charset=UTF-8";
        vcontent&&(headers["content-type"]=vcontent); //处理默认contentType
      }
      headers=utils.deletekey(headers,["content-security-policy","content-encoding","content-length"]);//删除csp限制
      headers=utils.deletekey(headers,["last-modified","etag"]);//删除缓存相关
      headers=utils.deletekey(headers,["access-control-allow-origin","access-control-allow-methods","access-control-allow-headers","access-control-allow-credentials"]);//删除已统一配置的key
      istextHtml=(headers["content-type"]||"").includes("text/html")
      env.contentType=headers["content-type"]||"";//设置content-type
      const beforfuncs=[istextHtml&&confg.scripts&&plugins.addScripts.bind(plugins,confg.scripts),confg.module&&plugins.moduleCode,confg.proxyLocation&&plugins.relocation],
      afterfunc=[istextHtml&&plugins.insertInnerScript],
      filters=beforfuncs.concat(resConfig.res).concat(afterfunc).filter(f=>f&&typeof f==="function");
      // 加工响应数据
      const execcontent=utils.textcontent(res2.headers,env,filters);
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

console.log("服务启动:",localPort,confg.server)