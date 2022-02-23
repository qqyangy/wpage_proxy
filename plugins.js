const plugins={
  //插入代码
  insertInnerScript(html="",hosts){
    return html.replace("<head>",`<head><script>(()=>{
      const hosts=${JSON.stringify(hosts)};
      (${plugins.xhrtxt().toString()})();
    })()</script>`);
  },
  //设置xhr
  xhrtxt(){
    return ()=>{
      const myfetch=window.fetch,
      myopen=XMLHttpRequest.prototype.open;
      const filterUrl=(url="")=>{
        const index=hosts.findIndex(d=>url.includes(d.host));
        return index!==-1?url.replace(hosts[index].host,`${location.protocol}//${location.hostname}:${hosts[index].serverPort}`):url;
      }
      window.fetch=function fetch(url,...p){
        return myfetch(filterUrl(url),...p);
      }
      XMLHttpRequest.prototype.open=function open(type,url,...p){
        return myopen.call(this,type,filterUrl(url),...p);
      }
    }
  },
  //设置css
  csstxt(){

  },
  //设置js
  scripttext(){

  }
}
module.exports=plugins;