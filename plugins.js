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
      const myfetch=window.fetch;
      window.fetch=function fetch(url,...p){
        const index=hosts.findIndex(d=>url.includes(d.host)),
        origin=index!==-1?url.replace(hosts[index].host,`${location.protocol}//${location.hostname}:${hosts[index].serverPort}`):url;
        console.log(origin,url);
        return myfetch(origin,...p);
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