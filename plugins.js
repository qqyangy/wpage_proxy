module.exports={
  //插入代码
  insertScript(html){

  },
  //设置xhr
  xhr(){
    return ()=>{
      const myfetch=window.fetch;
      window.fetch=function fetch(url,...p){
        return myfetch(url,...p);
      }
    }
  },
  //设置css
  css(){

  },
  //设置js
  script(){

  }
}