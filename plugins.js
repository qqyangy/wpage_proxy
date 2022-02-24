const plugins={
  //插入代码
  insertInnerScript(html="",{hosts}){
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
  moduleCode(text,{hosts,hostName,oldOrigin,contentType,url}){
    if(/html|javascript/.test(contentType)){
      hosts.forEach(o=>{
        let i=0;
        while((i=text.indexOf(o.host,i))!==-1){
          text=text.replace(o.host,`http://${hostName}:${o.serverPort}`);
        }
      })
    }
    return text;
  }
}
module.exports=plugins;