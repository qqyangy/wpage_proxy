
const http=require("http"),
path=require("path"),
url=require("url");

const index=process.argv[2] || 0, // 获取配置索引
confgs=(d=>d instanceof Array?d:[d])(require(path.resolve(process.cwd(),"./proxy.config.js"))).map(o=>(!/^\w+:\/\//.test(o.host)&&(o.host='http://'+o.host),o)), //获取全部配置
confg=confgs[index],//获取当前配置
domain=url.parse(confg.host||"http:localhost:3001"),
{port="",hostname=""}=domain,
protocol=(domain.protocol||"http").replace(":",""),
hosts=confgs.map(o=>(t=>port?`${t}:${port}`:t)(`${protocol}://${hostname}`));

const textcontent=(h,res,fnc=(t=>t))=>{
  const iscode=/text|javascript|json/.test(h["content-type"]);
  let dt="";
  return (data,isend)=>{
      if(iscode){
        if(!isend){
          dt+=data.toString();
        }else{
          res.end(fnc(dt))
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
http.createServer((req,res)=>{
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
    headers.cookie=confg.cookie;
  }
  const reqs2=http.request({
    ...options,
    headers,
    body:req.body,
    method: req.method
  },res2=>{
    res.writeHead(200,deletekey(res2.headers,["content-security-policy","content-encoding"]));//删除csp限制
    const execcontent=textcontent(res2.headers,res);
    res2.on('data', function(data) {
      execcontent(data);
    });
    res2.on('end', function(data) {
      execcontent(data,1);
    });
  }).end();
}).listen((confg.serverPort||9200)+Number(index));

console.log("服务启动:",(confg.serverPort||9200)+Number(index),confg.host)