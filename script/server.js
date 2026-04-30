
const http = require("http"),
  https = require("https"),
  net = require("net"),
  tls = require("tls"),
  axios = require("axios"),
  url = require("url"),
  plugins = require("./plugins.js"),
  utils = require("./utils.js"),
  mimes = require("./mime.config.js"),
  { MyWriteStream } = require("./MyStream.js");

// Reuse upstream connections for better proxy performance
const upstreamHttpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 256,
  maxFreeSockets: 64,
  timeout: 60_000,
  keepAliveMsecs: 30_000
});
const upstreamHttpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 256,
  maxFreeSockets: 64,
  timeout: 60_000,
  keepAliveMsecs: 30_000
});

const index = process.argv[2] || 0; // 获取配置索引

let { configall, confgs, content } = utils.formatConfig(),//读取配置
  confg = confgs[index];//获取当前配置
const defaultlocalPort = configall.localPort || 9200,//全局默认端口
  localIp = utils.getIPAddress(),//获取本机ip
  weinrePort = utils.weinrePort(configall),
  weinreHost = weinrePort ? `http://${localIp}:${weinrePort}/target/target-script-min.js#anonymous` : "",
  hosts = confgs.map((o, i) => {
    const domain = url.parse(o.server || "http:localhost:3001"),
      { port = "", hostname = "" } = domain,
      protocol = (domain.protocol || "http").replace(":", ""),
      localPort = o.localPort || (defaultlocalPort + Number(i));//服务端
    console.log(o);
    return {
      protocol,
      hostname,
      ws: !!o.ws,
      port,
      host: port ? `${protocol}://${hostname}:${port}` : `${protocol}://${hostname}`,
      localIp,
      localPort
    };
  }),
  { port, hostname, protocol, localPort } = hosts[index];// 获取对饮篇日志
confg.server = utils.formatServer(confg.server);//删除最后斜杠
//监听配置文件变化并热更新
utils.watchConfig(o => {
  //更新篇日志
  configall = o.configall;
  confgs = o.confgs;
  confg = confgs.find(o => utils.formatServer(o.server) === utils.formatServer(confg.server) && o.localPort === confg.localPort) || confg;
  confg.server = utils.formatServer(confg.server);//删除最后斜杠
  console.log("配置更新成功");
}).content = content;

// 生成处理响应数据函数
const configHandlerPickUp = (headers, req, resConfig, env, bodyfile = "") => {
  if (!headers["content-type"]) {
    const ext = utils.getExt(bodyfile) || utils.getExt(req.url),// 获取文件后缀
      vcontent = ext && mimes[ext] || index == 0 && "text/html; charset=UTF-8";
    vcontent && (headers["content-type"] = vcontent); //处理默认contentType
  }
  headers = utils.deletekey(headers, ["content-security-policy", "content-encoding", "content-length"]);//删除csp限制
  headers = utils.deletekey(headers, ["last-modified", "etag"]);//删除缓存相关
  headers = utils.deletekey(headers, ["access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers", "access-control-allow-credentials"]);//删除已统一配置的key
  const istextHtml = (headers["content-type"] || "").includes("text/html");
  if (confg.setCookie && istextHtml && confg.cookie) {
    headers = utils.deletekey(headers, ["Set-Cookie"]);
    headers["set-cookie"] = confg.cookie.split(";").map(t => t.trim());//是否需要在前端种植cookie
  }
  env.contentType = headers["content-type"] || "";//设置content-type

  const aftersource = [!confg.disableWeinre && weinreHost].filter(t => t);//需要最后处理插入的js资源
  const beforfuncs = [istextHtml && confg.scripts && plugins.addScripts.bind(plugins, confg.scripts), confg.module && plugins.moduleCode, confg.proxyLocation && plugins.relocation],
    afterfunc = [
      istextHtml && plugins.insertInnerScript,//注入基础脚本
      istextHtml && aftersource.length > 0 && plugins.insertScriptSrcs.bind(plugins, aftersource)//注入外部js
    ],
    bashfuncs = beforfuncs.concat(resConfig.resultfuncs).concat(afterfunc),
    filters = bashfuncs.filter(f => f && typeof f === "function");
  // 加工响应数据
  return utils.textcontent(headers, env, filters);
}

const corsHeader = {
  'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Referer, Accept-Language, Connection, Pragma, Authorization, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, X-Requested-By, If-Modified-Since, X-File-Name, X-File-Type, Cache-Control, Origin,*',
  // "Access-Control-Expose-Headers": "Authorization",
  "Access-Control-Allow-Credentials": "true"
};
const accessControlRequestHeaders = (reqHeaders) => {
  const keys = ["access-control-request-headers", "Access-Control-Request-Headers"],
    lenth = keys[0].length,
    key = keys.find(t => t in reqHeaders) || Object.keys(reqHeaders).find(t => {
      if (t.length !== keys[0].length) return "";
      return /^access-control-request-headers$/i.test(t);
    });
  if (!key) return "";
  return reqHeaders[key];
}

const server = http.createServer(async (req, res) => {
  try {
    req.headers.origin && Object.assign(corsHeader, { "Access-Control-Allow-Origin": req.headers.origin });//允许对当前域跨域
    const requestHeaders = accessControlRequestHeaders(req.headers || {});
    if (requestHeaders) {
      corsHeader["Access-Control-Allow-Headers"] += `,${requestHeaders}`;
    }
    if (req.method == 'OPTIONS') {
      res.writeHead(204, corsHeader);
      return res.end();
    }
    const options = {
      type: protocol,
      host: hostname,
      port,
      path: req.url,
      url: `${protocol}://${hostname}${port ? `:${port}` : ""}${req.url}`
    };
    const urlParse = url.parse(options.url),
      urlParsepick = ["protocol", "hostname", "pathname", "hash", "query"].reduce((o, k) => (o[k] = urlParse[k] || "", o), {});
    urlParsepick.query_o = urlParsepick.query.split("&").reduce((o, s) => {
      const pair = s.split("=");
      return o[pair[0]] = pair[1] || "", o;
    }, {});
    //定制环境数据
    const env = {
      ...urlParsepick,
      keepInsert: !!confg.keepInsert,
      localStorage: confg.localStorage,
      sessionStorage: confg.sessionStorage,
      url: options.url,
      // ourl:hosts[index].host+req.url,
      path: req.url,
      proxyLocation: confg.proxyLocation,
      mapUrl: (v => {
        return v && v instanceof Array && (v.length > 0 && !(v[0] instanceof Array) ? [v] : v) || [];
      })(configall.mapUrl).filter(a => a.length > 1).map(a => a.length > 3 ? a.slice(0, 3) : a),
      origin: hosts[index].host,
      norigin: (t => {
        return utils.urlformat(t, "http", localPort);
      })(req.headers.origin ? req.headers.origin : (req.headers.host || "localhost:3001")),
      localIp,
      nhostname: url.parse(utils.urlformat(req.headers.host || req.headers.origin)).hostname,
      hosts,
      tools: utils.tools,
      params: req.method === 'POST' ? new Promise(resolve => {
        let body = '';
        req.on('data', (data) => {
          body += data;
        });
        req.on('end', () => {
          try {
            resolve(body);
          } catch (e) {
            resolve(body);
          }
        });
      }) : null
    };
    env.nurl = env.norigin + req.url;//新的url

    const resConfig = utils.extractTrans(configall, confg, env)//获取配置中res项
    if (resConfig.mock) {
      const reshead = Object.assign({}, corsHeader);
      const execcontent = configHandlerPickUp(reshead, req, resConfig, env, resConfig.res.bodyFile);
      const resultdata = await execcontent(resConfig.res.body);
      resConfig.res.body = resultdata.body;
      return utils.resMock({ req, res, resConfig, reshead }); // 处理mock结果
    }
    const nhost = port ? hostname + ":" + port : hostname,
      headers = Object.assign(utils.deletekey(req.headers, [
        "if-none-match",
        "if-modified-since",
        "cache-control",
        // hop-by-hop headers (avoid interfering with keep-alive/pooling)
        "connection",
        "proxy-connection",
        "keep-alive",
        "transfer-encoding",
        "upgrade"
      ]), {
        host: nhost,
        referer: (req.headers.referer || "").replace(req.headers.host, nhost)
      })
    // Force upstream to return uncompressed payloads, so our content rewriting
    // (which removes content-encoding) won't cause garbled bytes.
    headers["accept-encoding"] = "identity";
    if (confg.cookie) {
      headers.cookie = confg.cookie; //有配置cookie时代理cookie
    }

    const reqOptionsInit = {
      ...options,
      headers,
      method: req.method
    };
    const reqConfig = utils.extractTrans(configall, confg, env, "req")//获取配置中req项
    const { reqStream, reqPromise } = utils.reqFilter(reqOptionsInit, reqConfig, env);
    req.pipe(reqStream);
    reqPromise.then(({ optins: reqOptions, data: reqdata }) => {
      const resStream = new MyWriteStream();//响应数据中转流
      const axiosCfg = Object.assign({
        data: reqdata,
        responseType: "stream",
        // keep-alive agents for upstream connection pooling
        httpAgent: upstreamHttpAgent,
        httpsAgent: upstreamHttpsAgent,
        // avoid hanging sockets under bad networks
        timeout: 60_000,
        transitional: { clarifyTimeoutError: true }
      }, reqOptions)
      axios(axiosCfg).then(async (d) => {
        d.data.pipe(resStream);
        const execcontent = configHandlerPickUp(d.headers, req, resConfig, env);
        resStream.then(async d => {
          try {
            const resultdata = await execcontent(d);
            res.writeHead(resultdata.statusCode || res.statusCode || 200, Object.assign(resultdata.headers, corsHeader));
            res.end(resultdata.body);
          } catch (e) {
            console.log("Error1", env.url);
          }
        });
      }).catch(error => {
        console.log("Error2", env.url);
        res.statusCode = error && error.response && error.response.status || 500;
        res.end();
      });
    })
  } catch (e) {
    console.log("Error0", req.url)
  }
});

// Keep client connections alive too (Node defaults vary by version)
server.keepAliveTimeout = 75_000;
server.headersTimeout = 80_000;
server.requestTimeout = 0;

// WebSocket proxy (handles Upgrade requests)
server.on("upgrade", (req, socket, head) => {
  const upstreamPort =
    port ? Number(port) : (protocol === "https" ? 443 : 80);

  const upstreamHostHeader = upstreamPort ? `${hostname}:${upstreamPort}` : hostname;

  const upstreamHeaders = Object.assign(
    {},
    utils.deletekey(req.headers || {}, ["proxy-connection"]),
    { host: upstreamHostHeader }
  );

  const requestLines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
  for (const [k, v] of Object.entries(upstreamHeaders)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const vv of v) requestLines.push(`${k}: ${vv}`);
    } else {
      requestLines.push(`${k}: ${v}`);
    }
  }
  requestLines.push("", "");
  const rawRequest = requestLines.join("\r\n");

  const onUpstreamConnect = (upstreamSocket) => {
    upstreamSocket.write(rawRequest);
    if (head && head.length) upstreamSocket.write(head);

    socket.pipe(upstreamSocket);
    upstreamSocket.pipe(socket);

    upstreamSocket.on("error", () => socket.destroy());
    socket.on("error", () => upstreamSocket.destroy());
  };

  const onError = () => {
    try {
      socket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
    } catch { }
    socket.destroy();
  };

  try {
    if (protocol === "https") {
      const upstreamSocket = tls.connect(
        {
          host: hostname,
          port: upstreamPort,
          servername: hostname
        },
        () => onUpstreamConnect(upstreamSocket)
      );
      upstreamSocket.on("error", onError);
    } else {
      const upstreamSocket = net.connect(
        { host: hostname, port: upstreamPort },
        () => onUpstreamConnect(upstreamSocket)
      );
      upstreamSocket.on("error", onError);
    }
  } catch {
    onError();
  }
});

server.listen(localPort);

console.log("服务启动=>", confg.server, "=>", `http://localhost:${localPort}`, "||", `http://${localIp}:${localPort}`);