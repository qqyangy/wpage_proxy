#!/bin/bash

wpage_proxy_path=/Users/admin/project/wpage_proxy/;

# 处理命令参数
. ${wpage_proxy_path}bin/cmd_parm.sh;

# 处理参数出现错误则直接退出
if [[ $? -ne 0 ]];
then
 exit 0;
fi;

# 判断是否传入目录参数 如果有则切换到指定目录
runpath=${1%proxy.config.js*};
if [[ "$runpath" != "" && -f "${runpath%/}/proxy.config.js" ]];then
  cd $runpath;
fi;
# 运行代理程序
node ${wpage_proxy_path}main.js;