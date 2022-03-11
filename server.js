
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
const parseNetDatas={
  reqHead:[confg.reqHead],
  reqBody:[confg.reqBody],
  resHead:[confg.resHead],
  resBody:[confg.module&&plugins.moduleCode,confg.resBody]
},
//生成过滤器调用函数
filterNetDataFunc=(env,ary=[],nary=[])=>{
  const a=ary.concat(nary).filter(f=>f && f instanceof Function);
  return a.length>0&&((t,hs)=>a.reduce((r,f)=>f(r,env),t));
}
//发送数据
const textcontent=(h,res,fnc)=>{
  const iscode=/text|javascript|json/.test(h["content-type"]);
  let dt="";
  return (data,isend,url)=>{
      if(iscode && fnc){
        dt+=data;
        if(isend){
          res.end(fnc?fnc(dt,hosts):dt);
        }
      }else{
        return isend?res.end(data):res.write(data);
      }
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

  const resExecs=(()=>{
    
  })();


  const filterNetDataFunc2=filterNetDataFunc.bind(null,env),
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
  },(err,res2)=>{
    // req.url==="/spa/activity/foxvip/"&&console.log(res2.statusCode);
    if(res2.statusCode !== 200 || err){
      res.writeHead(500,{});//删除csp限制
      res.end({statusCode:(res2&&res2.statusCode)||500,err});
      return; 
    }
    let headers=res2.headers;
    headers=deletekey(headers,["content-security-policy","content-encoding","content-length"]);//删除csp限制
    headers=deletekey(headers,["access-control-allow-origin","access-control-allow-methods","access-control-allow-headers","access-control-allow-credentials"]);//删除已统一配置的key
    headers=Object.assign(headers,corsHeader);
    res.writeHead(200,headers);
    istextHtml=(res2.headers["content-type"]||"").includes("text/html")
    env.contentType=res2.headers["content-type"]||"";//设置content-type
    const execcontent=textcontent(res2.headers,res,filterNetDataFunc2(parseNetDatas.resBody,[istextHtml&&plugins.insertInnerScript]));
    execcontent(data2,1,options.url);
  });
  req.on("data",function(data){
    reqs2.write(data);
  })
  req.on("end",function(){
    reqs2.end();
  })
  reqs2.on("data",function(data){
    data2=data2?Buffer.concat([data2,data],data2.length+data.length):data;
  })
  reqs2.on("end",function(data){
    data&&(data2=data2?Buffer.concat([data2,data],data2.length+data.length):data);
  })
}).listen(serverPort);

console.log("服务启动:",serverPort,confg.location)