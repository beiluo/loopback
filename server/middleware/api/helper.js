var fs = require("fs");	
var path = require("path");
var config = require("../config");

function checkAppId(appId,response){  
	var appsDir = config.mcmAppPath;
	var LastThreeChar=appId.substr(appId.length-3);
	var appPath =path.join(appsDir,LastThreeChar,appId);
	if (!appId||!fs.existsSync(appPath)) {
		return response.errWithCode(0, 101);            
	}
	return appPath;
}

module.exports={
	checkAppIdAndReturnPath:checkAppId
}