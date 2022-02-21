const child_process=require("child_process"),
path=require("path");
const confgs=(d=>d instanceof Array?d:[d])(require(path.resolve(process.cwd(),"./proxy.config.js")));
const servers=confgs.map((c,i)=>{

  const server=child_process.exec(`node ${path.resolve(__dirname,"./server.js")} ${i}`,(error, stdout, stderr)=>{
    console.log("启动服务:",i);
  });
  
  server.stdout.on('data', (data) => {
    console.log(`服务${i}消息: ${data}`);
  });
  
  server.stderr.on('data', (data) => {
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