
cmd=$(ls /Applications | egrep -i "Visual\s+Studio\s+Code");
if [[ "$cmd" != "" ]];
then
    if [[ ! -d ./wpage_proxy_bodyfiles ]];
    then
        mkdir wpage_proxy_bodyfiles;
        open -a "/Applications/$cmd/" ./wpage_proxy_bodyfiles;
    fi;
    open -a "/Applications/$cmd/" ./wproxy.config.js;
else
    open .;
    echo "找不到vscode应用,请手动打开"
fi;