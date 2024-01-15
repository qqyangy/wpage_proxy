#!/bin/bash

#安装依赖
# npm install

echo "依赖安装完成,准备安装全局命令"

if which wpage_proxy > /dev/null 2>&1;then
    echo "当前环境已安装,无需重复安装"
    exit;
fi;

#重置执行文件路劲
cat ./template/wpage_proxy.template.sh | sed "s#^wpage_proxy_path.*\$#wpage_proxy_path=$PWD/#" > ./bin/wpage_proxy.sh;

if ! test -f ~/.bashrc;then
    test -f ~/.bash_profile && grep wpage_proxy < ~/.bash_profile > /dev/null 2>&1 || echo ". ~/.bashrc" > ~/.bash_profile
fi;
echo "alias wpage_proxy=$PWD/bin/wpage_proxy.sh" >> ~/.bashrc;
. ~/.bashrc;
echo 安装成功！