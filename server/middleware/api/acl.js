var request = require("request");
var async = require("async");
var host = "http://127.0.0.1";
module.exports = function setModelACL(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var permissions = req.body.permissions ? JSON.parse(req.body.permissions) : undefined;
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    if (!modelName || !permissions) {
        return res.errWithCode(0, 104);
    }
    var theModel = registry.findModel(modelName);
    if (!theModel) {
        return res.errWithCode(0, 105);
    }

    defineAclsFromPermissions(modelName, permissions, theModel.settings.acls, app, function (acls) {
        theModel.settings.acls = acls || [];
        var options = {
            url: host + "/explorer/setFileModelACL",
            method: "POST",
            json: {
                "modelName": modelName,
                "acls": acls
            },
            headers: {
                "x-apicloud-appid": appId
            }
        }
        request(options, function (err, response, body) {
            if (err)  res.errWithCode(0, 104)
            return res.json(body);
        })
    });
}
function defineAclsFromPermissions(modelName, permissions, aclArray, theApp, fn) {
    if (!permissions || !modelName) {
        return;
    }
    if (!aclArray) {
        aclArray = [
            {
                accessType: "*",
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "DENY"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "create"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "count"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "exists"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "findOne"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "find"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "findById"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "updateAttributes"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "deleteById"
            },
            {
                principalType: "ROLE",
                principalId: "$everyone",
                permission: "ALLOW",
                property: "removeById"
            }
        ];
    }
    var aclObj = {};
    for (var i = 0; i < aclArray.length; i++) {
        var acl = aclArray[i];
        if (!acl) continue;
        var property = acl.property;
        var accessType = acl.accessType;
        if (accessType) {
            aclObj["accessType"] = [];
            aclObj["accessType"].push(acl);
        } else {
            if (property) {
                if (aclObj[property]) {
                    aclObj[property].push(acl);
                } else {
                    aclObj[property] = [];
                    aclObj[property].push(acl);
                }
            }
        }
    }
    for (var key in permissions) {
        var p = permissions[key];
        switch (key) {
            case "create":
                aclObj.create = [];
                if (Array.isArray(p)) {
                    for (var i = 0, len = p.length; i < len; i++) {
                        var arrp = p[i];
                        if (arrp.roles === "$owner") {
                            aclObj.create.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "create"
                            });
                        } else {
                            if (arrp.roles && arrp.roles.length) {
                                for (var j = 0; j < arrp.roles.length; j++) {
                                    aclObj.create.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "create"
                                    });
                                }
                            }
                            if (arrp.users && arrp.users.length) {
                                for (var j = 0; j < arrp.users.length; j++) {
                                    aclObj.create.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "create"
                                    });
                                }
                            }
                        }
                    }
                    break;
                } else {
                    if (p.roles === "$everyone") {
                        aclObj.create.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "create"
                        });
                        break;
                    }
                }
            case "get":
                aclObj.findById = [];
                aclObj.exists = [];
                if (Array.isArray(p)) {
                    for (var i = 0, len = p.length; i < len; i++) {
                        var arrp = p[i];
                        if (arrp.roles === "$owner") {
                            aclObj.findById.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "findById"
                            });
                            aclObj.exists.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "exists"
                            });
                        } else {
                            if (arrp.roles && arrp.roles.length) {
                                for (var j = 0; j < arrp.roles.length; j++) {
                                    aclObj.findById.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "findById"
                                    });
                                    aclObj.exists.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "exists"
                                    });
                                }
                            }
                            if (arrp.users && arrp.users.length) {
                                for (var j = 0; j < arrp.users.length; j++) {
                                    aclObj.findById.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "findById"
                                    });
                                    aclObj.exists.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "exists"
                                    });
                                }
                            }
                        }
                    }
                    break;
                } else {
                    if (p.roles === "$everyone") {
                        aclObj.findById.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "findById"
                        });
                        aclObj.exists.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "exists"
                        });
                        break;
                    }
                }
            case "find":
                aclObj.find = [];
                aclObj.count = [];
                aclObj.findOne = [];
                if (Array.isArray(p)) {
                    for (var i = 0, len = p.length; i < len; i++) {
                        var arrp = p[i];
                        if (arrp.roles === "$owner") {
                            aclObj.find.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "find"
                            });
                            aclObj.findOne.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "findOne"
                            });
                            aclObj.count.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "count"
                            });
                        } else {
                            if (arrp.roles && arrp.roles.length) {
                                for (var j = 0; j < arrp.roles.length; j++) {
                                    aclObj.find.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "find"
                                    });
                                    aclObj.findOne.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "findOne"
                                    });
                                    aclObj.count.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "count"
                                    });
                                }
                            }
                            if (arrp.users && arrp.users.length) {
                                for (var j = 0; j < arrp.users.length; j++) {
                                    aclObj.find.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "find"
                                    });
                                    aclObj.findOne.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "findOne"
                                    });
                                    aclObj.count.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "count"
                                    });
                                }
                            }
                        }
                    }
                    break;
                } else {
                    if (p.roles === "$everyone") {
                        aclObj.find.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "find"
                        });
                        aclObj.findOne.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "findOne"
                        });
                        aclObj.count.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "count"
                        });
                        break;
                    }
                }
            case "update":
                aclObj.updateAttributes = [];
                if (Array.isArray(p)) {
                    for (var i = 0, len = p.length; i < len; i++) {
                        var arrp = p[i];
                        if (arrp.roles === "$owner") {
                            aclObj.updateAttributes.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "updateAttributes"
                            });
                        } else {
                            if (arrp.roles && arrp.roles.length) {
                                for (var j = 0; j < arrp.roles.length; j++) {
                                    aclObj.updateAttributes.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "updateAttributes"
                                    });
                                }
                            }
                            if (arrp.users && arrp.users.length) {
                                for (var j = 0; j < arrp.users.length; j++) {
                                    aclObj.updateAttributes.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "updateAttributes"
                                    });
                                }
                            }
                        }
                    }
                    break;
                } else {
                    if (p.roles === "$everyone") {
                        aclObj.updateAttributes.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "updateAttributes"
                        });
                        break;
                    }
                }
            case "delete":
                aclObj.deleteById = [];
                aclObj.removeById = [];
                if (Array.isArray(p)) {
                    for (var i = 0, len = p.length; i < len; i++) {
                        var arrp = p[i];
                        if (arrp.roles === "$owner") {
                            aclObj.deleteById.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "deleteById"
                            });
                            aclObj.removeById.push({
                                principalType: "ROLE",
                                principalId: "$owner",
                                permission: "ALLOW",
                                property: "removeById"
                            });
                        } else {
                            if (arrp.roles && arrp.roles.length) {
                                for (var j = 0; j < arrp.roles.length; j++) {
                                    aclObj.deleteById.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "deleteById"
                                    });
                                    aclObj.removeById.push({
                                        principalType: "ROLE",
                                        principalId: arrp.roles[j],
                                        permission: "ALLOW",
                                        property: "removeById"
                                    });
                                }
                            }
                            if (arrp.users && arrp.users.length) {
                                for (var j = 0; j < arrp.users.length; j++) {
                                    aclObj.deleteById.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "deleteById"
                                    });
                                    aclObj.removeById.push({
                                        principalType: "USER",
                                        principalId: arrp.users[j],
                                        permission: "ALLOW",
                                        property: "removeById"
                                    });
                                }
                            }
                        }
                    }
                    break;
                } else {
                    if (p.roles === "$everyone") {
                        aclObj.deleteById.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "deleteById"
                        });
                        aclObj.removeById.push({
                            principalType: "ROLE",
                            principalId: "$everyone",
                            permission: "ALLOW",
                            property: "removeById"
                        });
                        break;
                    }
                }
            case "execute":
                aclObj.execute = [];
                if (modelName === "user") {
                    aclObj.execute.push({
                        principalType: "ROLE",
                        principalId: "$everyone",
                        permission: "ALLOW",
                        property: "confirm"
                    });
                    aclObj.execute.push({
                        principalType: "ROLE",
                        principalId: "$everyone",
                        permission: "ALLOW",
                        property: "resetPasswordRequest"
                    });
                    aclObj.execute.push({
                        principalType: "ROLE",
                        principalId: "$everyone",
                        permission: "ALLOW",
                        property: "resetPassword"
                    });
                    aclObj.execute.push({
                        principalType: "ROLE",
                        principalId: "$everyone",
                        permission: "ALLOW",
                        property: "verifyEmail"
                    });
                    aclObj.execute.push({
                        principalType: "ROLE",
                        principalId: "$everyone",
                        permission: "ALLOW",
                        property: "login"
                    });
                    aclObj.execute.push({
                        principalType: "ROLE",
                        principalId: "$everyone",
                        permission: "ALLOW",
                        property: "logout"
                    });
                }
                break;
            default:
                break;
        }
    }
    var acls = [];
    for (var key in aclObj) {
        var acl = aclObj[key];
        if (Array.isArray(acl)) {
            for (var i = 0; i < acl.length; i++) {
                acls.push(acl[i]);
            }
        } else {
            acls.push(acl);
        }
    }
    var user = theApp.models["user"];
    async.map(acls, function (acl, cb) {
        if (acl.principalType == "USER") {
            user.findOne({where: {username: acl.principalId}}, function (err, item) {
                if (item) {
                    acl.aliasName = acl.principalId;
                    acl.principalId = item.id.toString();
                }
                cb(null, acl)
            })
        } else {
            cb(null, acl);
        }
    }, function (err, results) {
        console.log(results);
        fn(results);
    });
}