function formatReqCfg(req,url,results){
  return ({
    "[object Function]":()=>results.push(req),
    "[object Array]":()=>req.forEach(o=>formatReqCfg(o,url,results)),
    "[object Object]":()=>{
      if("test" in req){
        const type=Object.prototype.toString.call(req.test),
        sTest=type==="[object String]" && url.includes(req.test),
        rTest=type==="[object RegExp]" && req.test.test(url);
        if(!sTest && !rTest) return;//有test且验证不通过
      }
      const headers=req.headers&&req.headers.constructor===Object&&req.headers; //获取配置的headers
      if(req.body && req.body.constructor===Object){
        // 需要使用mock数据
        results.mockIndex=results.length;
        results.push(function(){
          headers&&(this.headers=headers);//判断是否需要设置headers
          this.body=req.body;
        });
      }else if(req.handler && req.handler.constructor===Function){
        // 使用handler处理
        results.push(headers?function(...p){
          this.headers=headers;
          return req.handler.call(this,...p);
        }:req.handler);
      }else if(headers){
        // 只有headers时生成处理函数
        return  results.push(function(){
            this.headers=headers;
        })
      }
    }
  }[Object.prototype.toString.call(req)]||(()=>{}))()
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
    formatReqCfg(pcfg.req,url,resultfuncs); // 处理根配置
    formatReqCfg(cfg.req,url,resultfuncs); // 处理对应域配置
    const mock="mockIndex" in resultfuncs;//是否为mock类型
    return {
      mock,
      res:mock?resultfuncs[resultfuncs.mockIndex]:resultfuncs
    }
  }
}