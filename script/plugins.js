const fs=require("fs"),
path=require("path");
//通过script配置对象生成script标签
const formatScript=o=>{
  if(!o || o.constructor!==Object){
    return;
  }
  const {content,url,file,attrs=""}=o;
  const iattrs=(t=>t?` ${t}`:t)(typeof attrs ==="string"?attrs.trim():"");//需要设置的attr
  if(content){
    return `<script ${iattrs}>${content}</script>`
  }
  if(file){
    const filepath=path.resolve(process.cwd(),file);
    return fs.existsSync(filepath)&&`<script ${iattrs}>${fs.readFileSync(filepath)}</script>`;
  }
  if(url){
    return `<script src="${url}"${iattrs}></script>`
  }
},
//找到对应位置插入script标签
insertScript=(html,keys=[],obj,endmark)=>{
  let i=-1;
  const nhtml=html.replace(/<script\b[\W\w]*<\/script>/g,t=>{
    const slist=[];
    i++;
    while(keys.length>0 && keys[0]%100<=i){
      const k=keys.shift(),
      t=formatScript(obj[k]);
      t&&slist.push(t);
      i++;
    }
    const ns=slist.join("\n");//需要插入的script内容
    return `${ns}${t}`;
  });
  const lastScripts=keys.map(k=>formatScript(obj[k])).filter(t=>t).join("\n");//需要插入尾部的script标签
  return lastScripts?nhtml.replace(endmark,`${lastScripts}${endmark}`):nhtml;
},
//过滤加工url
filterUrl=()=>{
  return (url="")=>{
    const index=hosts.findIndex(d=>url.includes(d.host));
    return index!==-1?url.replace(hosts[index].host,index===0?location.origin:`http://${hosts[index].localIp}:${hosts[index].localPort}`):url;
  }
},
//设置xhr
xhrTxt=()=>{
  return ()=>{
    const myfetch=window.fetch,
    myopen=XMLHttpRequest.prototype.open;
    window.fetch=function fetch(url,...p){
      return myfetch(filterUrl(url),...p);
    }
    XMLHttpRequest.prototype.open=function open(type,url,...p){
      return myopen.call(this,type,filterUrl(url),...p);
    }
  }
},
// 设置location
creatLocation=()=>{
  return ()=>{
    const loc=window.proxyLocation={};
    loc.__proto__=location.__proto__;
    const pagehost=hosts[0],
    getval={
      host:pagehost.hostname.replace(/(:\d+)?$/,pagehost.port?`:${pagehost.port}`:""),
      hostname:pagehost.hostname,
      href:location.href.replace(location.origin,pagehost.host),
      origin:pagehost.host,
      port:pagehost.port,
      protocol:pagehost.protocol
    },
    setval={
      host(v){
        return location.host=v.replace(getval.host,location.host);
      },
      hostname(v){
        return location.hostname=v.replace(getval.hostname,location.hostname);
      },
      href(v){
        return location.href=v.replace(getval.origin,location.origin);
      },
      origin(v){
        return location.origin=v.replace(getval.origin,location.origin);
      },
      port(v){
        return location.port=v.replace(getval.port,location.origin);
      },
      protocol(v){
        return location.protocol=v.replace(getval.protocol,location.protocol);
      }
    };
    lKeys=Object.keys(location),
    opt=lKeys.reduce((o,k)=>{
      const v=location[k];
      if(typeof v === "function"){
        loc[k]=v.bind(location);
      }else{
        const isreset=Object.prototype.hasOwnProperty.call(getval,k);
        o[k]={
          get(){
            return isreset?getval[k]:location[k];
          },
          set(v){
            return isreset?(setval(v)):(location[k]=v);
          }
        }
      }
      return o;
    },{});
    Object.defineProperties(window.proxyLocation,opt);
  }
}
//设置css与js
cssAndJstxt=()=>{
  return ()=>{
    const appendChild2=HTMLElement.prototype.appendChild;
    HTMLElement.prototype.appendChild=function appendChild(dom,...p){
      if(dom instanceof HTMLScriptElement && dom.src){
        dom.src=filterUrl(dom.src);
      }else if(dom instanceof HTMLStyleElement && dom.href){
        dom.href=filterUrl(dom.href);
      }
      return appendChild2.call(this,dom,...p);
    }
  }
};
const plugins={
  //插入代码
  insertInnerScript(html="",h,{hosts,proxyLocation}){
    return html.replace("<head>",`<head><script>(()=>{
      const hosts=${JSON.stringify(hosts)},
      filterUrl=${filterUrl().toString()};
      ${proxyLocation?`(${creatLocation().toString()})();`:""}
      (${xhrTxt().toString()})();
      (${cssAndJstxt().toString()})();
    })()</script>`);
  },
  // 处理配置项的module字段
  moduleCode(text,h,{hosts,localIp,contentType,url}){
    if(/html|javascript/.test(contentType)){
      hosts.forEach(o=>{
        let i=0;
        while((i=text.indexOf(o.host,i))!==-1){
          text=text.replace(o.host,`http://${localIp}:${o.localPort}`);
        }
      })
    }
    return text;
  },
  // 处理浏览器location
  relocation(text,h,{contentType}){
    return /html|javascript/.test(contentType)?text.replace(/\blocation\b/gm,"proxyLocation"):text;
  },
  //向html中添加js脚本
  addScripts(scripts,text,h,{contentType,url}){
    if(contentType && contentType.includes("html") && text && /<html/i.test(text) && scripts && scripts.constructor===Object && scripts.test){
      const isstr=typeof scripts.test === "string",
      isreg=!isstr && scripts.test instanceof RegExp;
      if(!(isstr && url.includes(scripts.test) || isreg && scripts.test.test(url))) return text;
      const numkeys=Object.keys(scripts).map(n=>Number(n)).filter(n=>!Number.isNaN(n));
      numkeys.forEach(n=>{
        const o=scripts[n];
        return o && typeof o ==="string" && /^https?:\/\/\w+?/.test(o) && (scripts[n]={url:o});//转换直接url为对象url属性
      });
      const skeys=numkeys.filter(k=>(scripts[k] && scripts[k].constructor===Object));
      const headn=skeys.filter(n=>n>=0&&n<100).sort((a,b)=>a-b),
      bodyn=skeys.filter(n=>n>=100).sort((a,b)=>a-b);
      headn.length>0 && (text=text.replace(/<head\b[\W\w]*<\/head>/,htext=>insertScript(htext,headn,scripts,"</head>")));
      bodyn.length>0 && (text=text.replace(/<body\b[\W\w]*<\/body>/,btext=>insertScript(btext,bodyn,scripts,"</body>")));
    }
    return text;
  }
}
module.exports=plugins;