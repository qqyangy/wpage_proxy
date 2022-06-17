#!/bin/bash
if [[ $# -ge 1 ]];
then
  # 运行clean命令
  if [[ $1 == clean ]];
  then
    # 删除配置
    if [[ -f ./wproxy.config.js  ]];
    then
      rm -f ./wproxy.config.js;
    fi;
    # 删除bodyfile目录
    if [[ -d ./wpage_proxy_bodyfiles ]];
    then
      rm -rf ./wpage_proxy_bodyfiles;
    fi;
    if [[ $? -eq 0 ]];
    then
      echo -e "\033[32m清除成功！\033[0m";
    fi;
    exit 0
  fi;
   # 运行touch命令
  if [[ $1 == touch ]];
  then
     if [[ $# -lt 2 ]];
    then
      echo "tip:至少要指定1个需要创建的文件！"
    else
      touchfiles=($*);
      for ((i=1;i<${#touchfiles[*]};i++)){
        filename=./wpage_proxy_bodyfiles/${touchfiles[i]##*/};
        if [[ -f $filename ]];
        then
          echo -e "\033[33m已存在 $filename 文件无需重复创建！\033[0m"
        else
          if [[ ! -d ./wpage_proxy_bodyfiles ]];
          then
            mkdir ./wpage_proxy_bodyfiles;
          fi;
          touch $filename;
          if [[ $? -eq 0 ]];
          then
            echo -e "\033[42;30m 成功创建文件：\033[0;32m $filename \033[0m"
          else
            echo -e "\033[41;30m 文件创建失败：\033[0;31m $filename \033[0m"
          fi;
        fi;
      }
    fi;
    exit 0;
  fi;
   # 运行ls命令
  if [[ $1 == ls ]];
  then
    if [[ -f ./wproxy.config.js ]];
    then
      echo;
      ls -lh | awk '$9=="wproxy.config.js"{printf "%-40s%10s\n",$9,$5;}'
      echo "----------------------------------------------------------------"
    fi;
    if [[ -d ./wpage_proxy_bodyfiles ]];
    then
      ls -lh ./wpage_proxy_bodyfiles | awk '$9{printf "%-40s%10s\n","wpage_proxy_bodyfiles/"$9,$5;}'
      echo "----------------------------------------------------------------"
      ls ./wpage_proxy_bodyfiles | xargs echo;
      echo;
    fi;
    exit 0;
  fi;
   # 运行remove命令
  if [[ $1 == remove ]];
  then
    if [[ $# -lt 2 ]];
    then
      echo "tip:至少要指定1个要删除的文件！"
    else
      if [[ $2 == "-d" ]];
      then
        if [[ -d ./wpage_proxy_bodyfiles ]];
        then
          rm -rf ./wpage_proxy_bodyfiles;
           if [[ $? -eq 0 ]];
           then
              echo -e "\033[32m删除 ./wpage_proxy_bodyfiles 目录成功！\033[0m"
           else
              echo -e "\033[31m删除 ./wpage_proxy_bodyfiles 目录失败！\033[0m"
           fi;
        else
          echo '不存在目录：./wpage_proxy_bodyfiles'
        fi;
       exit 0;
      fi;
      args=($*);
      for ((i=1;i<${#args[*]};i++)){
        file=${args[i]};
        filename=./wpage_proxy_bodyfiles/${file##*/};
        if [[ -f $filename ]];
        then
          rm -f $filename;
          if [[ $? -eq 0 ]];
          then
            echo -e "\033[42;30m 成功删除文件：\033[0;32m $filename \033[0m"
          else
            echo -e "\033[41;30m 文件删除失败：\033[0;31m $filename \033[0m"
          fi;
        else
          echo -e "\033[43;30m 并不存在文件：\033[0;33m $filename \033[0m"
        fi;
      }
    fi;
    exit 0;
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
      if [[ -d ./wpage_proxy_bodyfiles ]];
      then
         open -a "/Applications/$cmd/" ./wpage_proxy_bodyfiles;
      fi;
      open -a "/Applications/$cmd/" ./wproxy.config.js;
    else
      open .;
      echo "找不到vscode应用,请手动打开"
    fi;
    exit 0
  fi;
  # 下载文件
  echo $1;
  if [[ $1 == down ]];
  then
    if [[ $# -ge 3 ]];
    then
      if [[ ! -d ./wpage_proxy_bodyfiles ]];
      then
        mkdir ./wpage_proxy_bodyfiles;
      fi;
      curl -o "./wpage_proxy_bodyfiles/$2" $3;
    else
     echo -e "\033[31m缺少下载参数,正确下载命令格式为：\033[33m wpage_proxy down 文件名 远程资源url\033[0m";
    fi;
    exit 0
  fi;
fi;