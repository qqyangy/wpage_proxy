const fs = require("fs"),
  path = require("path"),
  utils = require("./utils.js");
//通过script配置对象生成script标签
const formatScript = o => {
  if (!o || o.constructor !== Object) {
    return;
  }
  const { content, url, file, attrs = "" } = o;
  const iattrs = (t => t ? ` ${t}` : t)(typeof attrs === "string" ? attrs.trim() : "");//需要设置的attr
  if (content) {
    return `<script ${iattrs}>${content}</script>`
  }
  if (file) {
    const filepath1 = path.resolve(process.cwd(), file),
      filepath2 = path.resolve(process.cwd(), "./wpage_proxy_bodyfiles/", file),
      filepath = fs.existsSync(filepath1) && filepath1 || fs.existsSync(filepath2) && filepath2;
    return filepath && `<script ${iattrs}>${fs.readFileSync(filepath)}</script>`;
  }
  if (url) {
    return `<script src="${url}"${iattrs}></script>`
  }
},
  //找到对应位置插入script标签
  insertScript = (html, keys = [], obj, endmark) => {
    let i = -1;
    const nhtml = html.replace(/<script\b[\W\w]*<\/script>/g, t => {
      const slist = [];
      i++;
      while (keys.length > 0 && keys[0] % 100 <= i) {
        const k = keys.shift(),
          t = formatScript(obj[k]);
        t && slist.push(t);
        i++;
      }
      const ns = slist.join("\n");//需要插入的script内容
      return `${ns}${t}`;
    });
    const lastScripts = keys.map(k => formatScript(obj[k])).filter(t => t).join("\n");//需要插入尾部的script标签
    return lastScripts ? nhtml.replace(endmark, `${lastScripts}${endmark}`) : nhtml;
  },
  //过滤加工url
  filterUrl = (url1 = "") => {
    const { url, skip } = remapUrl(url1);
    if (skip) { return url; };//判断是否需要跳过代理
    const index = hosts.findIndex(d => url.includes(d.host));
    return index !== -1 ? url.replace(hosts[index].host, index === 0 ? location.origin : `http://${hosts[index].localIp}:${hosts[index].localPort}`) : url;
  },
  createMapUrl = mps => {
    const mapurls = hosts.map((o, i) => {
      return [i === 0 ? location.origin : `http://${o.localIp}:${o.localPort}`, o.host];
    });
    return url => {
      const ou = mapurls.find(a => url.includes(a[0])) || ["", ""], //提取原始origin
        ourl = url.replace(ou[0], ou[1]);//还原url
      return mps.filter(a => {
        return a.length > 1 && typeof a[1] === "function" && (typeof a[0] === "string" && ourl.includes(a[0]) || a[0].constructor === RegExp && a[0].test(ourl) || a[0] instanceof Function && a[0](ourl));
      }).reduce((r, a) => {
        return { url: a[1](r.url, hosts), skip: !!a[2] };
      }, { url: ourl, skip: false });
    }
  },
  //设置xhr
  xhrTxt = () => {
    const wpage_proxy_fetch = window.fetch,
      wpage_proxy_open = XMLHttpRequest.prototype.open,
      wpage_proxy_WebSocket = window.WebSocket,
      wpage_proxy_EventSource = window.EventSource
    window.fetch = function fetch(url, ...p) {
      return wpage_proxy_fetch(filterUrl(url), ...p);
    }
    XMLHttpRequest.prototype.open = function open(type, url, ...p) {
      return wpage_proxy_open.call(this, type, filterUrl(url), ...p);
    }
    wpage_proxy_WebSocket && (window.WebSocket = function WebSocket(url, ...p) {
      return new wpage_proxy_WebSocket(filterUrl(url), ...p);
    })
    wpage_proxy_EventSource && (window.EventSource = function EventSource(url, ...p) {
      return new wpage_proxy_EventSource(filterUrl(url), ...p);
    })
  },
  // 设置location
  creatLocation = () => {
    const loc = window.proxyLocation = document.proxyLocation = {};
    loc.__proto__ = location.__proto__;
    const pagehost = hosts[0],
      getval = {
        host: pagehost.hostname.replace(/(:\d+)?$/, pagehost.port ? `:${pagehost.port}` : ""),
        hostname: pagehost.hostname,
        href: location.href.replace(location.origin, pagehost.host),
        origin: pagehost.host,
        port: pagehost.port,
        protocol: pagehost.protocol + ":"
      },
      setval = {
        host(v) {
          return location.host = v.replace(getval.host, location.host);
        },
        hostname(v) {
          return location.hostname = v.replace(getval.hostname, location.hostname);
        },
        href(v) {
          return location.href = v.replace(getval.origin, location.origin);
        },
        origin(v) {
          return location.origin = v.replace(getval.origin, location.origin);
        },
        port(v) {
          return location.port = v.replace(getval.port, location.origin);
        },
        protocol(v) {
          return location.protocol = v.replace(getval.protocol, location.protocol);
        }
      };
    lKeys = Object.keys(location),
      opt = lKeys.reduce((o, k) => {
        const v = location[k];
        if (typeof v === "function") {
          loc[k] = v.bind(location);
        } else {
          const isreset = Object.prototype.hasOwnProperty.call(getval, k);
          o[k] = {
            get() {
              return isreset ? getval[k] : location[k];
            },
            set(v) {
              return isreset ? (setval[k](v)) : (location[k] = v);
            }
          }
        }
        return o;
      }, {});
    Object.defineProperties(window.proxyLocation, opt);
  },
  //设置通过dom加载的外部资源
  domloadsource = () => {
    [
      [HTMLScriptElement, "src"],
      [HTMLLinkElement, "href"],
      [HTMLImageElement, "src"],
      [HTMLVideoElement, "src"],
      [HTMLAudioElement, "src"],
      [HTMLIFrameElement, "src"]
    ].forEach(function (a) {
      var o = a[0],
        attr = a[1],
        _prototype = o.prototype;
      var oldDefSrc = Object.getOwnPropertyDescriptor(_prototype, attr);
      Object.defineProperty(_prototype, attr, {
        get() {
          return oldDefSrc.get.call(this);
        },
        set(v) {
          oldDefSrc.set.call(this, filterUrl(v));
        }
      });
    })
  },
  // 包括函数的数组转字符串
  fucArry2text = (ary) => {
    const keymamfuncs = [];
    const sary = JSON.stringify(ary, (key, v) => (v instanceof Function || v instanceof RegExp) ? (() => {
      const k = `json-string-to-function-num${keymamfuncs.length}-reduction`;
      return keymamfuncs.push([k, v]), k;
    })() : v);
    return keymamfuncs.reduce((s, a) => {
      return s.replace(`"${a[0]}"`, a[1].toString());
    }, sary);
  },
  deletInsertCode = () => {
    const scriptinner = document.getElementById("proxy_insert_inner_script");
    scriptinner && scriptinner.parentNode.removeChild(scriptinner);// 移除支持的script标签
  },
  setInitStorage = (storage, storageTarget) => {
    Object.keys(storage).forEach(k => {
      var value = storage[k];
      if (!value || !["[object String]", "[object Number]"].includes(Object.prototype.toString.call(value))) return;
      storageTarget.setItem(k, value + "");
    });
  },
  creatStorageString = (localStorage, sessionStorage) => {
    const setInitStorageString = (localStorage || sessionStorage) && setInitStorage.toString(),
      insertStorage = [
        localStorage && `(${setInitStorageString})(${JSON.stringify(localStorage)}, localStorage)`,
        sessionStorage && `(${setInitStorageString})(${JSON.stringify(sessionStorage)}, sessionStorage)`,
      ].filter(v => v).join(";");
    return insertStorage && insertStorage + ";";
  };
const plugins = {
  //插入代码
  insertInnerScript(html = "", h, { hosts, proxyLocation, mapUrl, keepInsert, localStorage, sessionStorage }) {
    return html.replace("<head>", `<head><script id="proxy_insert_inner_script">(()=>{
      ${creatStorageString(localStorage, sessionStorage)}
      const hosts=${JSON.stringify(hosts)},
      remapUrl=${mapUrl.length ? `(${createMapUrl.toString()})(${fucArry2text(mapUrl)})` : "u=>({url:u,skip:false})"};
      const filterUrl=${filterUrl.toString()};
      ${proxyLocation ? `(${creatLocation.toString()})();` : ""}
      (${xhrTxt.toString()})();
      (${domloadsource.toString()})();
      ${!keepInsert ? `(${deletInsertCode.toString()})()` : ""}
    })()</script>`);
  },
  //注入外部js资源
  insertScriptSrcs(srcs = [], html) {
    const scripts = srcs.map(src => `<script src="${src}"></script>`);
    return html.replace("<head>", `<head>${scripts.join("\n")}`);
  },
  // 处理配置项的module字段
  moduleCode(text, h, { hosts, localIp, contentType, norigin }) {
    if (/html|javascript/.test(contentType)) {
      hosts.forEach((o, index) => {
        let i = 0;
        const host = "//" + o.host.split("//")[1],
          rHost = index === 0 ? norigin : `http://${localIp}:${o.localPort}`;
        const regexp = new RegExp(`(https?:)?${host.replace(/\./g, "\\.")}(?!(\\d+|:\\d+))`, "g");
        text = text.replace(regexp, rHost);
        // while ((i = text.indexOf(host, i)) !== -1) {
        //   const reg = new RegExp(`(https?:)?${host}`);
        //   text = text.replace(reg, index === 0 ? norigin : `http://${localIp}:${o.localPort}`);
        // }
      })
    }
    return text;
  },
  // 处理浏览器location
  relocation(text, h, { contentType }) {
    return /html|javascript/.test(contentType) ? text.replace(/\blocation\b/gm, "proxyLocation") : text;
  },
  //向html中添加js脚本
  addScripts(scripts, text, h, env) {
    const { contentType, url } = env;
    if (contentType && contentType.includes("html") && text && /<html/i.test(text) && scripts && scripts.constructor === Object && scripts.test) {
      if (!utils.urlTest(url, scripts.test, env)) return text; // 如果有test条件 但验证不通过则不处理
      const numkeys = Object.keys(scripts).map(n => Number(n)).filter(n => !Number.isNaN(n));
      numkeys.forEach(n => {
        const o = scripts[n],
          url = o && typeof o === "string",
          fkey = /^\w+(\.\w+)*$/.test(o) ? "file" : "url";
        return url && (scripts[n] = { [fkey]: o });//转换直接url为对象url属性
      });
      const skeys = numkeys.filter(k => (scripts[k] && scripts[k].constructor === Object));
      const headn = skeys.filter(n => n >= 0 && n < 100).sort((a, b) => a - b),
        bodyn = skeys.filter(n => n >= 100).sort((a, b) => a - b),
        headOutHtml = /<head\b[\W\w]*<\/head>/,
        bodyOutHtml = /<body\b[\W\w]*<\/body>/;
      headn.length > 0 && (text = text.replace(headOutHtml, htext => insertScript(htext, headn, scripts, "</head>")));
      bodyn.length > 0 && (text = text.replace(bodyOutHtml, btext => insertScript(btext, bodyn, scripts, "</body>")));
    }
    return text;
  }
}
module.exports = plugins;