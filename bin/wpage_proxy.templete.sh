#!/bin/bash

wpage_proxy_path=/Users/admin/project/wpage_proxy/;

if [[ $# == 1 ]];
then
  # 运行remove命令
  if [[ $1 == remove && -f ./proxy.config.js ]];
  then
    rm -f ./proxy.config.js;
    exit 0
  fi;
   # 运行init命令
  if [[ $1 == init ]];
  then
    . ${wpage_proxy_path}bin/creat_config.sh;
    exit 0
  fi;
   # 在vscode中打开
  if [[ $1 == open ]];
  then
    cmd=$(ls /Applications | egrep -i "Visual\s+Studio\s+Code");
    if [[ "$cmd" != "" ]];
    then
      open -a "/Applications/$cmd/" ./proxy.config.js;
    else
      echo "找不到vscode应用,请手动打开"
    fi;
    exit 0
  fi;
fi;

# 判断是否传入目录参数 如果有则切换到指定目录
runpath=${1%proxy.config.js*};
if [[ "$runpath" != "" && -f "${runpath%/}/proxy.config.js" ]];then
  cd $runpath;
fi;
# 运行代理程序
node ${wpage_proxy_path}main.js;