
const http=require("http"),
request = require("request")
path=require("path"),
url=require("url"),
plugins=require("./plugins.js"),
stream=require("stream");

const index=process.argv[2] || 0, // 获取配置索引
configall=require(path.resolve(process.cwd(),"./proxy.config.js")),
defaultServerPort=configall.serverPort||9200,
confgs=(d=>d instanceof Array?d:[d])(configall.proxy).map(o=>(!/^\w+:\/\//.test(o.location)&&(o.location='http://'+o.location),o)); //获取全部配置
//配置可继承属性
["cookie"].forEach(k=>{
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
const textcontent=(h,res,fnc)=>{
  const iscode=/text|javascript|json/.test(h["content-type"]);
  let dt="";
  return (data,isend)=>{
      if(iscode && fnc){
        if(!isend){
          dt+=data.toString();
        }else{
          res.end(fnc?fnc(dt,hosts):dt);
        }
      }else{
        return isend?res.end():res.write(data);
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
  },
  nhost=port?hostname+":"+port:hostname,
  headers=Object.assign(deletekey(req.headers,["accept-encoding"]),{
    host:nhost,
    referer:(req.headers.referer||"").replace(req.headers.host,nhost)
  })
  if(confg.cookie){
    headers.cookie=confg.cookie; //有配置cookie时代理cookie
  }
  const reqs2=http.request({
    ...options,
    headers,
    body:req.body,
    method: req.method
  },res2=>{
    if(res2.statusCode !== 200){
      res.writeHead(500,{});//删除csp限制
      res.end();
      return; 
    }
    let headers=res2.headers;
    headers=deletekey(headers,["content-security-policy","content-encoding","content-length"]);//删除csp限制
    headers=deletekey(headers,["access-control-allow-origin","access-control-allow-methods","access-control-allow-headers","access-control-allow-credentials"]);//删除已统一配置的key
    headers=Object.assign(headers,corsHeader);
    res.writeHead(200,headers);
    istextHtml=(res2.headers["content-type"]||"").includes("text/html")
    const execcontent=textcontent(res2.headers,res,istextHtml&&plugins.insertInnerScript);
    res2.on('data', function(data) {
      execcontent(data);
    });
    res2.on('end', function(data) {
      execcontent(data,1);
    });
    
  });
  req.pipe(reqs2);
}).listen(serverPort);

console.log("服务启动:",serverPort,confg.location)