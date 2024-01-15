if ! command -v code > /dev/null 2>&1;then
    start .
    echo "找不到vscode应用,请手动打开"
fi;
if [[ ! -d ./wpage_proxy_bodyfiles ]];
then
    mkdir wpage_proxy_bodyfiles;
    code ./wpage_proxy_bodyfiles;
fi;
code ./wproxy.config.js;