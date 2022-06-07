
module.exports={
  localPort:9200,//默认开始端口
  module:true,//是否处理es6模块
  proxyLocation:true,//是否代理浏览器location
  setCookie:true, // 向浏览器种cookie
  // weinre:1234,  //weinre启动端口
  mapUrl:[
    // ["__webpack_hmr",()=>"http://localhost:3000/__webpack_hmr",true] //
  ],
  proxy:[
    {
      localPort:$localPort,
      server:$server,
      res:[
        {
            test:"",
            handler(d,h,{tools}){
              // tools.jsonReset(d,{"data.availBalance":200});
              return d;
            }
        }
      ],
      cookie:""
    }
  ]
}