# wpage_proxy
> 简易的http代理工具,便于开发者做线上问题调试 以及本机开发跨域携带cookie模拟数据、借用其他环境其他接口数据等

### 功能点
- 监听请求
- 请求重置
- 可配置cookie便于夸设备免登录调试
- 资源替换与修改（可对以下内容完成替换或修改）
  - 请求参数
  - 请求地址
  - 请求体
  - 响应头
  - 响应体
  - 状态码
- mock数据
  - 直接配置数据
  - 本机文件数据
  - 在线数据
  - 可添加逻辑数据
- 动态脚本插入
  - 直接配置插入内容
  - 本机文件内容插入
  - 在线脚本插入
- 跨站跨域数据使用

### 安装
```sh
# 克隆项目
git clone http://gitlab.17zuoye.net:10080/yong.yang/wpage_proxy.git

# 进入项目文件夹
cd wpage_proxy

# 安装依赖及运行命令
npm run i

# 进入工作目录
cd /xxx/xxx/xxx/

# 创建配置文件 并写入nodejs 模块得导出代码
echo "module.exports={}" > proxy.config.js

# 使用开发工具打开配置文件 在{}中完善配置，配置方式参照配置项明细

# 运行代理程序 （在配置文档所在目录直接运行命令  或 在运行命令后带配置文件的目录位置参数）
wpage_proxy

```

### 使用方式
- 1.添加配置文件 `proxy.config.js`
- 2.在配置文件目录运行mian.js 如：`node main.js`

### 配置项明细
> 配置文件为nodejs可执行文件 可使用nodejs相关API及环境变量
- `localPort` `:number` 全局配置代理服务端口号（多个未配置端口号的服务使用此配置基础上已递增形式创建）【可被继承】
- `module` `:boolean` 是否对html及js内容进行检查并自动替换请求域名 【可被继承】
- `proxyLocation` `:boolean` 使用代理浏览器location 【可被继承】（由于代理会使访问地址发生变化、继而可能会使前端判逻辑产生问题，可以开启此项配置修复）
- `keepInsert` `:boolean` 是否保留浏览器注入代码 默认false 【可被继承】
- `mapUrl` `:array|:array二维` 配置请求url重置映射 【全局配置】
  - `:array` 只有一组时可使用
      - 第一个值`:string|:regexp` 分别使用`array[0].includes(url)`和`array[0].test(url)` 验证是否应用当前规则
      - 第二个值 `:function` 第一个参数元素url、第二个参数代理服务与元素服务的映射数组hosts 函数的返回值作为修改后的url使用
      - 第三个值 `:boolean` 非必须 默认false 新的url是否直接使用原始服务（跳过代理服务）
  - `:array二维` 如果需要使用多条规则时使用二位数组 其中item与单数组匹配规则一致
- `proxy` `:array|:object` 配置需要代理的域名 数组时Item结构同object结构
  - `server` `:string` 配置需要代理的域名地址 `协议://域名[:端口]`
  - `localPort` `:number` 代理服务端口 不配置时使用递增形式继承全局
  - `proxyLocation` `:boolean` 是否代理location 不配置时使用递增形式继承全局
  - `cookie` `:string` 被代理服务的cookie 可通过在控制台输入`document.cookie`获取
  - `scripts` `:object` 要插入html的js脚本
    - `test` `:string|:regexp` 确定要是用的脚本植入的被代理请求的url
        - `:string` 使用`url.includes(test)`方式验证（是否包含指定字符）
        - `:regexp` 使用`test.test(url)`方式验证（url使用能与正则匹配）
    - `数字key` `:object|:string` 配置要插入的脚本 key必须为数字类型或字符串数字类型[>=0] 数字越小脚本月靠前 小于100插入到head中 大于100插入到body中
        > content、file、url同时配置多个时生效优先级最高的（使用string类型时与只有url属性的对象相同,且url值与指定的string一致）
        - `content` `:string` 要插入的脚本内容 优先级3
        - `file` `:string` 本机文件相对于配置文件的相对路劲 也可使用绝对路劲 优先级2
        - `url` `:sting` 网络资源地址`协议://域名[:宽口][:路径][:参数]` 优先级1
        - `attrs` `:string` 需要植入到`script`标签上的额外属性 如：`defer="defer" type="text/javascript"`
    - `res` `:object|:function|:array`
      - `:function`
          - 3个参数 分别为 `data`、`headers`、`env` 原响应数据、原响应头、环境包（包括请求url、请求方式等）
          - 可通过需要修header时可设置`this.header`
          - 需要调整响应数据时 可以`this.body` 或 `return newdata`;
      - `:object`
          - `test` 添加生效条件配置方式同 `scripts.test`配置
          - `headers` `:object` 添加或覆盖指定的响应头 如:`{"content-type":"application/json"}`
          - `bodyFile` `:string` 指定本机文件地址相对于配置文件的相对路劲或绝对路径 使用文件内容作为响应体 优先级3 【使用mock数据并不会向原服务器发送请求】
        - `body` `:function|:string|:json` 优先级2 【使用mock数据并不会向原服务器发送请求】
          - `:function`
              - 可接受一个参数 `env` 环境包
              - return 值为响应数据
          - `:string|:json` 使用指定的数据响应
        - `handler` `:function` 对真实的象印数据处理 同res直接配置为函数的形式
      - `:array` 每个item为`:object`配置方式 并循环应用test通过的配置内容
    - `req` `:object|:function|:array`
      - `:function` 同res的函数配置形式
      - `:object`
          - `test/headers/bodyFile/body/handler` 同res (下面的属性可在handler中使用`this.xx`设置)
          - `statusCode` `:number` 配置显示的状态码
          - `path` `:string` 配置修改源服务器路径 比如 希望请求a接口却返回b接口数据
          - `query` `:string|:object` 配置调整请求原url的参数部分
          - `hash` `:string` 调整请求时hash 正常情况没什么用
          - `method` `:sting` 调整修改请求方式 `get|post|head|put|delete` 大小写不限
      - `:array` 每个item为`:object`配置方式 并循环应用test通过的配置内容

### env 包属性
  - `url` 通过代理请求的新url
  - `ourl` 原始请求url
  - `path` path及请求参数部分
  - `proxyLocation` proxyLocation配置项
  - `mapUrl` mapUrl配置项
  - `oldOrigin` 原请求域名（包含协议和端口）
  - `newOrigin` 通过代理请求域名（包含协议和端口）
  - `localIp` 代理服务器id地址
  - `hostName` 浏览器使用的域名（不包含协议及端口）
  - `hosts` 代理组域名映射信息

### 基础文档示例

```js
module.exports={
  proxyLocation:true,//是否代理浏览器location
  mapUrl:["__webpack_hmr",()=>"http://localhost:3010/__webpack_hmr",true],//监听热更新的服务使用原服务（不走代理）
  proxy:{
    server:"http://localhost:3010",// 代理本地开发服务
    localPort:5200, //代理服务端口
    cookie:"uid=sddfkxx.xxxxxxx." // cookie
  }
}
```

  