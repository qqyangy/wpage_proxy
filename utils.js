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
  }
}