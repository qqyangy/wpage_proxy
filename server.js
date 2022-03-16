
const http=require("http"),
request = require("request")
path=require("path"),
url=require("url"),
plugins=require("./plugins.js"),
utils=require("./utils.js"),
stream=require("stream");


const index=process.argv[2] || 0, // 获取配置索引
configall=require(path.resolve(process.cwd(),"./proxy.config.js")),
defaultServerPort=configall.serverPort||9200,
confgs=(d=>d instanceof Array?d:[d])(configall.proxy).filter(o=>o.location).map(o=>(!/^\w+:\/\//.test(o.location)&&(o.location='http://'+o.location),o)); //获取全部配置
//配置可继承属性
["cookie","module"].forEach(k=>{
  configall.hasOwnProperty(k) && confgs.forEach(o=>{
    !o.hasOwnProperty(k) && (o[k]=configall[k]);
  })
})
const confg=confgs[index],//获取当前配置
hosts=confgs.map((o,i)=>{
  const domain=url.parse(o.location||"http:localhost:3001"),
  {port="",hostname=""}=domain,
  protocol=(domain.protocol||"http").replace(":",""),
  serverPort=o.serverPort||(defaultServerPort+Number(i));//服务端
  return {
    protocol,
    hostname,
    port,
    host:port?`${protocol}://${hostname}:${port}`:`${protocol}://${hostname}`,
    serverPort
  };
}),
{port,hostname,protocol,serverPort}=hosts[index];// 获取对饮篇日志
//发送数据
const textcontent=(h,env,fncs)=>{
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
};
//删除指定key
const deletekey=(o={},ks=[])=>{
  ks.forEach(k=>{
    if(Object.prototype.hasOwnProperty.call(o,k)){
      delete o[k];
    }
  })
  return o;
};
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
    url:options.url,
    path:req.url,
    oldOrigin:hosts[index].host,
    newOrigin:(t=>{
      return utils.urlfromat(t,"http",serverPort);
    })(req.headers.origin?req.headers.origin:(req.headers.host||"localhost:3001")),
    hostName:url.parse(utils.urlfromat(req.headers.host||req.headers.origin)).hostname,
    hosts
  };

  const resConfig=utils.extractRes(configall,confg,env)//获取配置中req项
  if(resConfig.mock){
    // 处理mock结果
    const defaultContent=(t=>t.includes("charset")?t:`${t}; charset=utf-8`)((req.headers.accept||"").split(",").map(t=>t.trim())[0]||"text/plan"),
    body=resConfig.res.body,
    isJson=typeof body === 'object';
    res.writeHead(200,Object.assign({"content-type":isJson?"application/json; charset=UTF-8":defaultContent},resConfig.res.headers||{},corsHeader));
    return res.end(isJson?JSON.stringify(body):body);
  }
  nhost=port?hostname+":"+port:hostname,
  headers=Object.assign(deletekey(req.headers,["accept-encoding"]),{
    host:nhost,
    referer:(req.headers.referer||"").replace(req.headers.host,nhost)
  })
  if(confg.cookie){
    headers.cookie=confg.cookie; //有配置cookie时代理cookie
  }
  let data2;
  const reqs2=request({
    ...options,
    headers,
    method: req.method
  },(err,res2,data)=>{
    if(err || res2.statusCode >= 500){
      res.writeHead(500,{});//删除csp限制
      return res.end(data||err&&err.toString()||res2&&res2.statusCode||500);
    }
    let headers=res2.headers;
    headers=deletekey(headers,["content-security-policy","content-encoding","content-length"]);//删除csp限制
    headers=deletekey(headers,["access-control-allow-origin","access-control-allow-methods","access-control-allow-headers","access-control-allow-credentials"]);//删除已统一配置的key
    istextHtml=(res2.headers["content-type"]||"").includes("text/html")
    env.contentType=res2.headers["content-type"]||"";//设置content-type
    const beforfuncs=[confg.module&&plugins.moduleCode],
    afterfunc=[istextHtml&&plugins.insertInnerScript],
    filters=beforfuncs.concat(resConfig.res).concat(afterfunc).filter(f=>f&&typeof f==="function");
    // 加工响应数据
    const execcontent=textcontent(res2.headers,env,filters);
    const resultdata=execcontent(data);
    if(env.url.includes("master098f6/logo.png")){
      console.log(data.length);
    }
    // 响应数据
    res.writeHead(200,Object.assign(headers,resultdata.headers,corsHeader));
    res.end(resultdata.body);
  });
  req.pipe(reqs2);
}).listen(serverPort);

console.log("服务启动:",serverPort,confg.location)