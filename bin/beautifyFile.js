const fs=require("fs"),
path=require("path"),
uglifyjs=require("uglify-js");

const files=process.argv
if(files.length<2){
    process.exit(0);
}
var options = { 
  compress:false,//不压缩代码
  output:{
    beautify:true,//代码美化
    comments:true//保留注释
  } 
};
function successlog(txt){
  console.log(`美化成功：${txt}`)
}
const beautifyExt={
  ".js":code=>uglifyjs.minify(code,options).code,
  ".json":code=>JSON.stringify(JSON.parse(code),null,"\t"),
}
const notfiles=[];//未处理的文件集合
for(let i=2;i<files.length;i++){
  const pt=files[i];//获取文件
  const ext=(/\.\w+$/.exec(pt)||[])[0];//获取文件后缀
    const extfunc=beautifyExt[ext];
    const fpath=extfunc&&["./wpage_proxy_bodyfiles","./"].reduce((r,m)=>r || (u=>(fs.existsSync(u) && u || ""))(path.resolve(process.cwd(),m,pt)),"");
    if(fpath){
      fs.readFile(fpath,(err,code)=>{
        if(!err){
          const resultcode=extfunc(code.toString());
          fs.writeFile(fpath,resultcode,(err)=>{
            if(!err){
              successlog(fpath);
            }
          })
        }
      });
    }else{
      notfiles.push(pt);
    }
}
notfiles.length&&console.log("未处理文件：",...notfiles);


