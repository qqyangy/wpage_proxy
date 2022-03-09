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
  proxy:[
    {
      location:"https://br.test.17zuoye.net",
      serverPort:5200,
      cookie:'voxlastt=userType; br_s_uid=1000012; br_s_sign=2ad5893bd65064e858f89529cd2bd1a7faf6f32b.1646301665302; lupld=1; uid=263826; br_s_grade=NINTH_GRADE; undefined_br_home_info=%7B%22regionInfo%22%3A%7B%22provinceName%22%3A%22%u5C71%u897F%u7701%22%2C%22provinceCode%22%3A140000%2C%22cityName%22%3A%22%u6714%u5DDE%u5E02%22%2C%22cityCode%22%3A140600%2C%22countyName%22%3A%22%u6000%u4EC1%u5E02%22%2C%22countyCode%22%3A140681%7D%2C%22editInfoTip%22%3Atrue%7D; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22263826%22%2C%22%24device_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_referrer_host%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%2217be273b7ec141-0aee845b8622-1f3e6757-2073600-17be273b7edcf1%22%7D'
    }
  ]
}