#!/bin/bash

# 判断是否传入目录参数 如果有则切换到指定目录
runpath=${1%proxy.config.js*};
if [[ "$runpath" != "" && -f "${runpath%/}/proxy.config.js" ]];then
  cd $runpath;
fi;
# 运行代理程序
node /Users/admin/project/wpage_proxy/main.js;