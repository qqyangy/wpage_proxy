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
    console.log(keys[0],keys[1]);
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
};
const plugins={
  //插入代码
  insertInnerScript(html="",h,{hosts}){
    return html.replace("<head>",`<head><script>(()=>{
      const hosts=${JSON.stringify(hosts)},
      filterUrl=${plugins.filterUrl().toString()};
      (${plugins.xhrTxt().toString()})();
      (${plugins.cssAndJstxt().toString()})();
    })()</script>`);
  },
  //过滤加工url
  filterUrl(){
    return (url="")=>{
      const index=hosts.findIndex(d=>url.includes(d.host));
      return index!==-1?url.replace(hosts[index].host,`${location.protocol}//${location.hostname}:${hosts[index].serverPort}`):url;
    }
  },
  //设置xhr
  xhrTxt(){
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
  //设置css与js
  cssAndJstxt(){
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
  },
  // 处理配置项的module字段
  moduleCode(text,h,{hosts,hostName,oldOrigin,contentType,url}){
    if(/html|javascript/.test(contentType)){
      hosts.forEach(o=>{
        let i=0;
        while((i=text.indexOf(o.host,i))!==-1){
          text=text.replace(o.host,`http://${hostName}:${o.serverPort}`);
        }
      })
    }
    return text;
  },
  //向html中添加js脚本
  addScripts(scripts,text,h,{contentType,url}){
    if(contentType && contentType.includes("html") && scripts && scripts.constructor===Object && scripts.test){
      const isstr=typeof scripts.test === "string",
      isreg=!isstr && scripts.test instanceof RegExp;
      if(!(isstr && url.includes(scripts.test) || isreg && scripts.test.test(url))) return text;
      const skeys=Object.keys(scripts).map(n=>Number(n)).filter(n=>!Number.isNaN(n)).filter(k=>(scripts[k] && scripts[k].constructor===Object));
      const headn=skeys.filter(n=>n>=0&&n<100).sort((a,b)=>a-b),
      bodyn=skeys.filter(n=>n>=100).sort((a,b)=>a-b);
      headn.length>0 && (text=text.replace(/<head\b[\W\w]*<\/head>/,htext=>insertScript(htext,headn,scripts,"</head>")));
      bodyn.length>0 && (text=text.replace(/<body\b[\W\w]*<\/body>/,btext=>insertScript(btext,bodyn,scripts,"</body>")));
    }
    return text;
  }
}
module.exports=plugins;