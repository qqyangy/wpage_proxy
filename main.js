const child_process = require("child_process"),
  path = require("path"),
  fs = require("fs"),
  utils = require("./script/utils.js");
const configpath = path.resolve(process.cwd(), "./wproxy.config.js");
if (!fs.existsSync(configpath)) {
  return console.log("缺少配置文件：wproxy.config.js 你可以选择如下任一方式创建：\n1.使用 wpage_proxy init 命令创建 \n2.手动创建");
}
const localIp = utils.getIPAddress();
console.log("当前主机IP地址:", localIp);
const configall = require(configpath),
  confgs = (d => d instanceof Array ? d : [d])(configall.proxy);
const servers = confgs.filter(o => o.server).map((c, i) => {
  const server = child_process.exec(`node ${path.resolve(__dirname, "./script/server.js")} ${i}`, (error, stdout, stderr) => {
    // console.log(`启动服务:${i+1}`);
  });
  server.stdout.on('data', (data) => {
    console.log(`服务${i}消息: ${data}`);
  });
  server.stderr.on('error', (data) => {
    console.log(`服务${i}错误: ${data}`);
  });
  return server;
});

const weinrePort = utils.weinrePort(configall);
if (weinrePort) {
  //需要启动weinre
  const ls = child_process.spawn("weinre", ["--httpPort", weinrePort, "--boundHost", "-all-"]);
  const weinreLog = configall.weinreLog || 0;
  weinreLog && [1, 3].includes(weinreLog) && ls.stdout.on('data', (data) => {
    console.log(`${data}`);
  });
  weinreLog && [1, 2].includes(weinreLog) && ls.stderr.on('data', (data) => {
    console.log(`weinreErr: ${data}`);
  });
  console.log(`weinre: http://localhost:${weinrePort}`);
  ls.on("error", () => {
    console.log("weinre 启动失败");
  });
}

// 主进程托退出时
process.on('exit', () => {
  console.log("退出!");
  servers.forEach(server => {
    server.kill(9);
  })
});