#!/bin/bash

#安装依赖
# npm install

echo "依赖安装完成,准备安装全局命令"

#修改可执行文件路劲并把内容写入临时文件
cat ./bin/wpage_proxy.sh | sed "s#^node.*\$#node $PWD/main.js#" > ./bin/wpage_proxy.sh.tmp; 
#从零时文件写入到源文件
cat ./bin/wpage_proxy.sh.tmp > ./bin/wpage_proxy.sh;
#删除零时文件
rm -f ./bin/wpage_proxy.sh.tmp;

binpath=$(which node | sed "s#node\$#wpage_proxy#");
if [[ $binpath =~ wpage_proxy ]];then
    echo "安装路径:${binpath}"
else
    echo "安装路劲生成失败";
    exit 1;
fi
# 生成运行程序软连
if [ -f `which node` ];then
  echo 存在文件
fi;
rm -f $binpath;
ln ./bin/wpage_proxy.sh $binpath;

# 生成全局变量
export wpage_proxy=$binpath;
echo 安装成功！