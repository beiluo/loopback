var request = require("request");
var host = "http://127.0.0.1:801";
function setSenderEmail(req, res) {
    var app = req.app;
    var appId = req.headers["x-apicloud-appid"];
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    var senderEmail = req.body.senderEmail;

    if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(senderEmail)) {
        return res.errWithCode(0, 118);
    }
    var options = {
        url: host + "/explorer/setFileSenderEmail",
        method: "POST",
        json: {
            "senderEmail": senderEmail
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        if (err)  res.errWithCode(0, 125)
        app.set("senderEmail", senderEmail);
        return res.json(body);
    })
}

function setEmailVerify(req, res) {
    var app = req.app;
    var appId = req.headers["x-apicloud-appid"];
    var needVerify = (parseInt(req.body.needVerify) === 1) ? true : false;
    if (!appId) {
        return res.errWithCode(0, 101);
    }

    var options = {
        url: host + "/explorer/setFileEmailVerify",
        method: "POST",
        json: {
            "needVerify": needVerify
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        if (err)  res.errWithCode(0, 125)
        app.set("needVerify", needVerify);
        return res.json(body);
    })
}

function setVerifyInfo(req, res) {
    var app = req.app;
    var appId = req.headers["x-apicloud-appid"];
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    var language = req.cookies.i18next || "zh-CN";
    var lng = app.get("language");
    var verifySubjectEn="";
    if (lng == undefined) {
        if (language == "en-US")
            lng = "-en";
        else
            lng = "";
    }

    var verifySubject = req.body.verifySubject;
    var verifyContent = req.body.verifyContent;

    var options = {
        url: host + "/explorer/setFileVerifyInfo",
        method: "POST",
        json: {
            "lng": lng,
            "verifySubject":verifySubject,
            "verifyContent":verifyContent
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        if (err)  res.errWithCode(0, 125)
        app.set("language",lng);
        if (lng) {
            app.set("verifySubjectEn", verifySubject);
        } else {
            app.set("verifySubject",verifySubject);
        }
        return res.json(body);
    })
}

function setResetInfo(req, res) {
    var app = req.app;
    var appId = req.headers["x-apicloud-appid"];
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    var language = req.cookies.i18next || "zh-CN";
    var lng = app.get("language");
    if (lng == undefined) {
        if (language == "en-US")
            lng = "-en";
        else
            lng = "";
    }
    var resetSubject = req.body.resetSubject;
    var resetContent = req.body.resetContent;

    var options = {
        url: host + "/explorer/setFileResetInfo",
        method: "POST",
        json: {
            "lng": lng,
            "resetSubject":resetSubject,
            "resetContent":resetContent
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        if (err)  res.errWithCode(0, 125)
        app.set("language",lng);
        if (lng) {
            app.set("resetSubjectEn", resetSubject);
        } else {
            app.set("resetSubject",resetSubject);
        }
        return res.json(body);
    })
}

module.exports={
    setSenderEmail:setSenderEmail,
    setEmailVerify:setEmailVerify,
    setVerifyInfo:setVerifyInfo,
    setResetInfo:setResetInfo
}