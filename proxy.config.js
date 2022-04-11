module.exports={
  localPort:9200,//默认开始端口
  module:true,//是否处理es6模块
  proxyLocation:true,//是否代理浏览器location
  mapUrl:[
    ["user.vpage",()=>"http://www.baidu.com"]
  ],
  proxy:[
    {
      localPort:5830,
      server:"http://localhost:3010",
      cookie:"_ga=GA1.1.1766170942.1632625821; can_webp=1; va_sess=zG/suR0b7LaKv/08OeZqVZT1BkuCx9WqOloqSB10uBG069k21YY2sZQJwZU23KVEkt9N7blJ+Avy9xyEpKD1dQ; voxauth=zG/suR0b7LaKv/08OeZqVZT1BkuCx9WqOloqSB10uBG069k21YY2sZQJwZU23KVEkt9N7blJ+Avy9xyEpKD1dQ; sid=333953607; sajssdk_2015_cross_new_user=1; cookie=; luban_sess=RDEIICAhrf/XoszJoTg5CzU4Djl6nImGkwc+njojVf8; sign=17zuoye; voxlastt=userType; br_s_uid=1000012; br_s_sign=2ad5893bd65064e858f89529cd2bd1a7faf6f32b.1646301665302; uid=263826; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22%24device_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_referrer_host%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%22%22%7D; br_s_grade=NINTH_GRADE; sidebarStatus=0"
    }
  ]
}