#!/bin/bash

if [[ -f ./wproxy.config.js ]];
then
    while [ -z $isremove ];
    do
        echo -e "\033[33m当前目录已存在./wproxy.config.js配置文件是否要删除已有配置重建? (y/n) :\033[0m \c";
        read isremove;
    done;
    if [ $isremove == "n" ];
    then
        echo -e "已保留原有配置文件，请使用\033[32m wpage_proxy open\033[0m 命令打开配置文件进行编辑"
        exit 0;
    fi;
fi;

# 收集配置项值
echo -e "server（默认http://localhost:3000）: \c";
read server;
server=${server:-http://localhost:3000};

echo -e "localPort（默认5200）: \c";
read localPort;
localPort=${localPort:-5200};

# 生成配置文件
cat ${wpage_proxy_path}template/wproxy.config.template.js | awk -v server="$server" -v localPort="$localPort" -F ":" -v OFS=":" '{
  if(NF==2){
    if($2=="$server,"){
      $2="\""server"\",";
    }else if($2=="$localPort,"){
      $2=localPort",";
    }
  }
  print $0;
}' > ./wproxy.config.js;


if [ $? -eq 0 ]
then
    echo -e "\033[32m恭喜,创建配置成功!\n\033[0m";
    echo -e "是否需要在vscode中打开编辑？(y/n)默认y :\c";
    read isopen;
    if [[ $isopen != "n" ]];
    then
        echo $wpage_proxy_path
        ${wpage_proxy_path}bin/wpage_proxy.sh open;
    else
        echo -e "\033[0m您可以使用\033[32m wpage_proxy open \033[0m命令打开到vscode中进行编辑\033[0m";
    fi;
else
    echo -e "\033[31m创建配置失败,请重试\033[0m"
fi;

