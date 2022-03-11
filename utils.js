function formatResCfg(res,url,results){
  return ({
    "[object Function]":()=>results.push(res),
    "[object Array]":()=>res.forEach(o=>formatResCfg(o,url,results)),
    "[object Object]":()=>{
      if("test" in res){
        const type=Object.prototype.toString.call(res.test),
        sTest=type==="[object String]" && url.includes(res.test),
        rTest=type==="[object RegExp]" && res.test.test(url);
        if(!sTest && !rTest) return;//有test且验证不通过
      }
      const headers=res.headers&&res.headers.constructor===Object&&res.headers; //获取配置的headers
      if(res.body && res.body.constructor===Object){
        // 需要使用mock数据
        results.mockIndex=results.length;
        results.push(function(){
          headers&&(this.headers=headers);//判断是否需要设置headers
          this.body=res.body;
        });
      }else if(res.handler && res.handler.constructor===Function){
        // 使用handler处理
        results.push(headers?function(...p){
          this.headers=headers;
          return res.handler.call(this,...p);
        }:res.handler);
      }else if(headers){
        // 只有headers时生成处理函数
        return  results.push(function(){
            this.headers=headers;
        })
      }
    }
  }[Object.prototype.toString.call(res)]||(()=>{}))()
}
module.exports={
  // 格式化url
  urlfromat(url="",protocol="http",prot=""){
    const httpreg=/^https?:\/\//,
    protreg=/:\d+$/;
    if(!httpreg.test(url)){
      url=`${protocol}://${url}`
    }else{
      url=url.replace(httpreg,`${protocol}://`);
    }
    if(prot){
      if(!protreg.test(url)){
        url=`${url}:${prot}`
      }else{
        url=url.replace(/:\d+$/,prot);
      }
    }
    return url;;
  },
  // 提取res配置
  extractRes(pcfg,cfg,env){
    const url=env.url;
    const resultfuncs=[];
    formatResCfg(pcfg.res,url,resultfuncs); // 处理根配置
    formatResCfg(cfg.res,url,resultfuncs); // 处理对应域配置
    const mock="mockIndex" in resultfuncs;//是否为mock类型
    return {
      mock,
      res:mock?resultfuncs[resultfuncs.mockIndex]:resultfuncs
    }
  }
}