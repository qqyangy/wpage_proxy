const path = require("path"),
  fs = require("fs"),
  url = require("url"),
  child_process = require("child_process"),
  { MyWriteStream } = require("./MyStream.js");
// 获取正确的headers格式
const getObject = (d, env) => {
  const rd = typeof d === "function" ? d(env) : d;
  return rd && rd.constructor === Object ? rd : undefined;
},
  //对url进行条件验证
  urlTest = (url, testdt, env, isitem = false) => {
    if (!testdt || !url) return true; //如果无限制条件直接通过
    const testfunc = {
      "[object String]": () => url.includes(testdt),//验证字符串
      "[object RegExp]": () => testdt.test(url),//验证正则
      "[object Function]": () => testdt.length > 0 ? testdt(env) : testdt() === (env.path || "").split("?")[0],//验证函数(无参数则通过返回字符串与path对比否则根据返回的布尔值判断)
      "[object Array]": () => !isitem ? testdt.every(v => urlTest(url, v, env, true)) : true//验证数组 非第一层数组直接验证通过
    }[Object.prototype.toString.call(testdt)];//提取当前类型的验证函数
    return testfunc ? testfunc() : true;//如果找到对应类型验证函数则使用对应验证函数验证 否则直接验证通过
  },
  //配置文档path
  configPath = path.resolve(process.cwd(), "./wproxy.config.js"),
  // 获取正确的body数据
  getBodyData = (d, env) => {
    return typeof d === "function" ? d(env) : d
  },
  // 对象赋值
  setValue = (target, obj = {}, keys = []) => {
    target && keys.forEach(k => {
      if (target && k in obj) {
        target[k] = obj[k];
      }
    })
  },
  // 判断是否具备指定key
  iskeys = (obj = {}, keys = []) => keys.some(k => k in obj),
  //发送数据
  textcontent = (h, env, fncs) => {
    const iscode = /text|javascript|json/.test(h["content-type"]);
    return (data) => {
      let result = { body: data, headers: Object.assign({}, h) };
      if (iscode && fncs.length > 0) {
        fncs.forEach(f => {
          const rdata = Buffer.isBuffer(result.body) ? result.body.toString() : result.body;
          const d = f.call(result, rdata, result.headers, Object.assign({}, env));
          if (d !== undefined) {
            result.body = d;
          }
        });
        // 标准化响应体
        ({
          object: () => result.body = JSON.stringify(result.body),
          function: () => result.body = result.body.toString()
        }[result.body && (typeof result.body)] || (() => { }))();
        !(result.headers && result.headers.constructor === Object) && (result.headers = {});//如果headers不是对象则重置为空对象
      }
      return result;
    }
  },
  //首字母转大写
  headerFirstUpper = (t) => {
    return t.split("-").map(k => k.charAt(0).toUpperCase() + k.slice(1, k.length)).join("-");
  }
//删除指定key
deletekey = (o = {}, ks = []) => {
  ks.forEach(k => {
    [k, headerFirstUpper(k)].forEach(_k => {
      if (Object.prototype.hasOwnProperty.call(o, _k)) {
        delete o[k];
      }
    })
  })
  return o;
},
  // 处理bodyFile配置
  setBodyFile = (target) => {
    if (target.constructor === Object && target.bodyFile) {
      const isNetSource = /^https?:\/\/\w+(?:\.[^.]+)+/.test(target.bodyFile)
      if (isNetSource) {
        target.body = child_process.execSync(`curl ${target.bodyFile}`); //网络资源数据
        return target;
      }
      const pt = path.resolve(process.cwd(), target.bodyFile),
        pt2 = path.resolve(process.cwd(), "./wpage_proxy_bodyfiles/", target.bodyFile);
      const fpt = fs.existsSync(pt) && pt || fs.existsSync(pt2) && pt2;//返回有效文件路劲
      if (!fpt) {
        console.log(`指定的bodyFile：${target.bodyFile} 不存在!`);
      } else {
        target.body = fs.readFileSync(fpt); // 本机文件数据
      }
    }
    return target;
  },
  // 合并生成请求头
  mergeReqOptions = (optins, reqdt) => {
    const mkeys = ["method"];//可直接合并的key
    const isUrl = iskeys(reqdt, ["path", "query", "hash"]),
      isMkeys = iskeys(reqdt, mkeys),
      isheaders = reqdt.headers && reqdt.headers.constructor === Object;
    if (!isUrl && !isMkeys && !isheaders) {
      return optins; // 无任何需要变更时
    }
    const nOptins = Object.assign({}, optins);
    // 处理url相关
    if (isUrl) {
      const ourl = url.parse(optins.url);
      reqdt.path && (ourl.pathname = reqdt.path.replace(/^./, t => t === "/" ? t : `/${t}`));
      reqdt.query && (ourl.search = reqdt.query.replace(/^./, t => t === "?" ? t : `?${t}`));
      reqdt.hash && (ourl.hash = reqdt.hash.replace(/^#/, ""));
      optins.path = ourl.pathname + ourl.search + (reqdt.hash ? `#${reqdt.hash}` : "");
      optins.url = url.format(ourl);
    }
    // 处理method
    reqdt.method && (optins.method = /(?:get|post|head|put|delete)/i.test(reqdt.method) ? reqdt.method.toUpperCase() : optins.method);
    // 处理可直接合并的属性
    isMkeys && mkeys.forEach(k => (nOptins[k] = reqdt[k]));
    // 处理请求头信息
    if (isheaders) {
      nOptins.headers = Object.assign({}, nOptins.headers, reqdt.headers)
    }
  },
  // 获取本机ip
  getIPAddress = () => {
    if (getIPAddress.ip) return getIPAddress.ip;
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
      var iface = interfaces[devName];
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return getIPAddress.ip = alias.address;
        }
      }
    }
    return getIPAddress.ip = "localhost";
  };

const configkeys = ["path", "query", "hash", "method", "bodyFile", "statusCode"];//需要统一处理的配置项
// 格式化 res 和 req配置为函数
function formatResCfg(res, url, results, env) {
  return ({
    "[object Function]": () => results.push(res),
    "[object Array]": () => res.forEach(o => formatResCfg(o, url, results, env)),
    "[object Object]": () => {
      if ("test" in res) {
        if (!urlTest(url, res.test, env)) return;//有test但验证不通过
      }
      const headers = res.headers && (res.headers.constructor === Object || res.headers.constructor === Function) && res.headers; //获取配置的headers
      switch (true) {
        case iskeys(res, ["body", "bodyFile"]):
          // 需要使用mock数据
          results.mockFunc = function () {
            setValue(this, res, configkeys);
            headers && (this.headers = getObject(headers, env));//判断是否需要设置headers
            if (res.bodyFile) {
              setBodyFile(this, res.bodyFile)
            } else {
              this.body = getBodyData(res.body, env)
            }
            return this.body;
          };
        case res.handler && res.handler.constructor === Function:
          // 使用handler处理
          return results.push(headers ? function (...p) {
            setValue(this, res, configkeys);
            this.headers = getObject(headers, env);
            return res.handler.call(this, ...p);
          } : res.handler);
        case headers:
          // 只有headers时生成处理函数
          return results.push(function () {
            setValue(this, res, configkeys);
            this.headers = getObject(headers, env);
          })
        case iskeys(res, configkeys):
          // 处理 path、query
          return results.push(function () {
            setValue(this, res, configkeys);
          })
      }
    }
  }[Object.prototype.toString.call(res)] || (() => { }))()
};
//数据处理工具
const tools = {
  //字符串转json
  toJson(data) {
    if (!data || data instanceof Object) return data;
    const isString = typeof data === "string";
    let result = data;
    if (isString || Buffer.isBuffer(data)) {
      try {
        const dt = isString ? data : data.toString();
        result = JSON.parse(dt);
      } catch (e) { }
    }
    return result;
  },
  //设置数据
  jsonReset(data, conf = {}) {
    const dt = this.toJson(data) || data;
    if (!dt || !["[object Array]", "[object Object]"].includes(Object.prototype.toString(dt))) return data;
    const keys = Object.keys(conf);
    if (keys.length === 0) return dt;
    keys.forEach(k => {
      const val = conf[k];
      const ks = k.split(".").map(v => v.trim()).filter(v => v);
      ks.reduce((o, k1, i) => {
        const last = i === ks.length - 1;
        if (last) {
          let rval;
          try {
            rval = typeof val === "function" ? val(dt) : val;
          } catch (e) {
            console.log("jsonReset取值错误：", k);
          }
          return o[k1] = rval;
        }
        return o[k1] instanceof Object ? o[k1] : (o[k1] = {});
      }, dt);
    });
    return dt;
  }
};
module.exports = {
  textcontent,
  deletekey,
  getIPAddress,
  // 格式化url
  urlformat(url = "", protocol = "http", prot = "") {
    const httpreg = /^https?:\/\//,
      protreg = /:\d+$/;
    if (!httpreg.test(url)) {
      url = `${protocol}://${url}`
    } else {
      url = url.replace(httpreg, `${protocol}://`);
    }
    if (prot) {
      if (!protreg.test(url)) {
        url = `${url}:${prot}`
      } else {
        url = url.replace(/:\d+$/, `:${prot}`);
      }
    }
    return url;;
  },
  // 提取res 与 req配置
  extractTrans(pcfg, cfg, env, key = "res") {
    const url = env.url;
    const resultfuncs = [];
    formatResCfg(pcfg[key], url, resultfuncs, env); // 处理根配置
    formatResCfg(cfg[key], url, resultfuncs, env); // 处理对应域配置
    const mock = "mockFunc" in resultfuncs;//是否为mock类型
    const target = {};
    return {
      mock,
      [key]: mock && key === "res" ? resultfuncs.mockFunc.call(target) && target : resultfuncs,
      resultfuncs
    }
  },
  // 处理响应mock数据方法
  resMock({ req, res, resConfig, reshead }) {
    const defaultContent = (t => t.includes("charset") ? t : `${t}; charset=utf-8`)((req.headers.accept || "").split(",").map(t => t.trim())[0] || "text/plan"),
      body = resConfig.res.body,
      isJson = !Buffer.isBuffer(resConfig.res.body) && typeof body === 'object';
    res.writeHead(resConfig.res.statusCode || 200, Object.assign({ "content-type": isJson ? "application/json; charset=UTF-8" : defaultContent }, resConfig.res.headers || {}, reshead));
    res.end(isJson ? JSON.stringify(body) : body);
  },
  // 按照配置处理加工 请求相关数据
  reqFilter(optins, config, env) {
    let resolve;
    const reqStream = new MyWriteStream(),
      reqPromise = new Promise(r => (resolve = r));
    const result = { reqStream, reqPromise };
    if (config.req.length === 0) {
      reqStream.then(d => {
        resolve({ optins, data: d });
      });
      return result;
    }
    const headers = Object.assign({}, optins.headers),
      noptions = Object.assign({}, optins);
    reqStream.then(d => {
      const purl = url.parse(optins.url);
      const target = { headers, body: d, path: purl.pathname, query: purl.search, hash: purl.hash, method: optins.method };
      config.req.forEach(fus => {
        const rdt = fus.call(target, target.body, Object.assign({}, headers), Object.assign({}, env));//调用函数并获得返回值
        target.body = rdt !== undefined ? rdt : target.body;
      })
      // 处理参数为对象的形式
      if (target.query && target.query.constructor === Object) {
        target.query = Object.keys((r, k) => {
          return (t => r ? `&${r}${t}` : t)(`${k}=${target.query[k]}`);
        }, "");
      }
      // 处理返回数据为非字符串和非buffer时的转换
      if (target.body && !Buffer.isBuffer(target.body) && typeof target !== "string") {
        if (target.body instanceof Object) {
          target.body = JSON.stringify(target.body);
        } else if (target.body.toString) {
          target.body = target.body.toString();
        }
      }
      mergeReqOptions(noptions, target);//合并结果
      resolve({ optins: noptions, data: target.body });
    })
    return result;
  },
  //标准化配置
  formatConfig(c) {
    delete require.cache[configPath];//清楚模块缓存
    const configall = require(configPath),//读取配置
      confgs = (d => d instanceof Array ? d : [d])(configall.proxy).filter(o => o.server).map(o => (!/^\w+:\/\//.test(o.server) && (o.server = 'http://' + o.server), o)); //获取全部配置
    //配置可继承属性
    ["cookie", "module", "proxyLocation", "keepInsert", "setCookie", "localStorage", "sessionStorage"].forEach(k => {
      configall.hasOwnProperty(k) && confgs.forEach(o => {
        !o.hasOwnProperty(k) && (o[k] = configall[k]);
      })
    }),
      content = c || fs.readFileSync(configPath).toString();
    return { configall, confgs, content };
  },
  watchConfig(update) {
    fs.watchFile(configPath, () => {
      const ncontent = fs.readFileSync(configPath).toString(),
        centent = this.watchConfig.content;
      if (centent !== ncontent) {
        this.watchConfig.content = ncontent;//跟新状态
        update(this.formatConfig(ncontent));//跟新配置
      }
    })
    return this.watchConfig;
  },
  //提取weinre
  weinrePort(cfg) {
    return cfg && cfg.weinre && typeof cfg.weinre === "number" && cfg.weinre; //验证通过则返回端口号
  },
  // 删除server结尾处斜杠
  formatServer(s = "") {
    return s.replace(/\/$/, "");
  },
  //获取文件后缀
  getExt(url) {
    return (/\.\w+$/.exec(url.split("?")[0].split("#")[0]) || [""])[0].replace(".", "");
  },
  urlTest,
  tools
}