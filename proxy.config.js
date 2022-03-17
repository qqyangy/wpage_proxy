module.exports={
  serverPort:9200,//默认开始端口
  module:true,//是否处理es6模块
  proxy2:[
    {
      location:"parent.test.17zuoye.net",
      serverPort:5222,
      cookie:"can_webp=1; voxlastt=userType; lupld=1; voxauth=tv8x4pEl2qPOFzDfEQOjplqgARSxJCLfcZA3D5huCuyDdcCwyYhQnVtX3TQQqGa4AGKYYMwUv81f2ZV7n6U6zA; va_sess=tv8x4pEl2qPOFzDfEQOjplqgARSxJCLfcZA3D5huCuyDdcCwyYhQnVtX3TQQqGa4AGKYYMwUv81f2ZV7n6U6zA; uid=263826; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22263826%22%2C%22%24device_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_referrer_host%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%7D"
    },
    {
      location:"https://e.test.17zuoye.net",
      serverPort:5223,
      cookie:"can_webp=1; voxlastt=userType; lupld=1; voxauth=tv8x4pEl2qPOFzDfEQOjplqgARSxJCLfcZA3D5huCuyDdcCwyYhQnVtX3TQQqGa4AGKYYMwUv81f2ZV7n6U6zA; va_sess=tv8x4pEl2qPOFzDfEQOjplqgARSxJCLfcZA3D5huCuyDdcCwyYhQnVtX3TQQqGa4AGKYYMwUv81f2ZV7n6U6zA; uid=263826; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22263826%22%2C%22%24device_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_referrer_host%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%7D"
    },
    {
      location:"https://cdn-cnc.test.17zuoye.net",
      serverPort:9999
    }
  ],
  proxy3:[
    {
      location:"https://br.test.17zuoye.net",
      serverPort:5200,
      res:[{
        test:/profile/,
        headers:{"content-type":"application/json2"},
        statusCode:200,
        handler(d,env){
          this.headers={"content-type":"application/json3"};
          return {"success":true,"data":{"userId":29,"name":"次百次  ","avatar":"","mobile":"188****9878","gender":"N","birthday":"","grade":"NINTH_GRADE","gradeName":"九年级","provinceCode":140000,"cityCode":140600,"countyCode":140681,"provinceName":"山西省","cityName":"朔州市","countyName":"怀仁市","schoolId":0,"schoolName":"","integral":165700,"integralIcon":"currency.png","integralLink":"https://m.baidu.com"}}
        }
      }],
      cookie:'voxlastt=userType; br_s_uid=1000012; br_s_sign=2ad5893bd65064e858f89529cd2bd1a7faf6f32b.1646301665302; lupld=1; uid=263826; br_s_grade=NINTH_GRADE; undefined_br_home_info=%7B%22regionInfo%22%3A%7B%22provinceName%22%3A%22%u5C71%u897F%u7701%22%2C%22provinceCode%22%3A140000%2C%22cityName%22%3A%22%u6714%u5DDE%u5E02%22%2C%22cityCode%22%3A140600%2C%22countyName%22%3A%22%u6000%u4EC1%u5E02%22%2C%22countyCode%22%3A140681%7D%2C%22editInfoTip%22%3Atrue%7D; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22263826%22%2C%22%24device_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_referrer_host%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%7D'
    }
  ],
  proxy4:[
    {
      location:"https://www.jinshu-test.17zuoye.net",
      serverPort:5200,
      res:[{
        test:"uploadfile/image.vpage",
        handler(d,h,{url}){
          console.log(">>",d);
          console.log(url)
        }
      }],
      cookie:'17x_j_status=3; 17x_pversion=20200908; 17x_s_uid=559382; 17x_s_sign=17069e7c48f51cb106d2a10a1065f24ad83a6eae.1646795577843; 17x_s_grade=11; userType=NEVER_PAID_USER; _index_nb_alert=true; channelId=5F; 559382homeTime=1647248902288; checkUnpaidOrder=true'
    }
  ],
  proxy:[
    {
      location:"https://luban.test.17zuoye.net",
      serverPort:5200,
      cookie:'voxlastt=userType; luban_sess=RDEIICAhrf/XoszJoTg5CzU4Djl6nImGkwc+njojVf8; sidebarStatus=1; br_s_uid=1000012; br_s_sign=2ad5893bd65064e858f89529cd2bd1a7faf6f32b.1646301665302; uid=263826; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22%24device_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_referrer_host%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%22%22%7D; luban_auth=RDEIICAhrf/XoszJoTg5CzU4Djl6nImGkwc+njojVf8'
    },
    {
      location:"https://cnc-nerve.17zuoye.cn",
      req:{
        headers:{},
        handler(){}
      }
    }
  ]
}