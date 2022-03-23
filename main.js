const child_process=require("child_process"),
path=require("path"),
fs=require("fs");
const configpath=path.resolve(process.cwd(),"./proxy.config.js");
if(!fs.existsSync(configpath)){
  return console.log("配置文件：proxy.config.js 不存在,请先创建配置在运行命令");
}
const configall=require(configpath),
confgs=(d=>d instanceof Array?d:[d])(configall.proxy);
const servers=confgs.filter(o=>o.server).map((c,i)=>{
  const server=child_process.exec(`node ${path.resolve(__dirname,"./script/server.js")} ${i}`,(error, stdout, stderr)=>{
    console.log("启动服务:",i);
  });
  server.stdout.on('data', (data) => {
    console.log(`服务${i}消息: ${data}`);
  });
  server.stderr.on('error', (data) => {
    console.log(`服务${i}错误: ${data}`);
  });
  return server;
})

// 主进程托退出时
process.on('exit',()=>{
  console.log("退出!");
  servers.forEach(server=>{
    　　server.kill(9);
  })
});