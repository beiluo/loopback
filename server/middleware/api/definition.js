var async = require("async");
function getModelList(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelList = [];
    if (appId) {
        var models = app.models() || [];

        var modelArray = ['accessToken', 'file', 'role', 'roleMapping', 'user'];
        var userModelArray = [];
        models.forEach(function (model) {
            if (model.shared && modelArray.indexOf(model.modelName) == -1) {
                userModelArray.push(model.modelName);
            }
        })

        userModelArray.sort(function (a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();
            if (a < b) {
                return -1;
            } else if (b < a) {
                return 1;
            } else {
                return 0;
            }
        });

        for (var i = 0; i < userModelArray.length; i++) {
            modelArray.push(userModelArray[i]);
        }
        async.map(modelArray, function (key, cb) {
            var model = registry.findModel(key);
            model.count(function (err, c) {
                cb(err, {name: key, count: c});
            })
        }, function (err, results) {
            return res.ok({list: results});
        });
    } else {
        return res.errWithCode(0, 102);
    }
};

function getModelDefinition(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.params.modelName;
    var theModel;
    if (!appId) {
        return res.errWithCode(0, 101);
    }

    if (!modelName) {
        return res.errWithCode(0, 105);
    }
    theModel = registry.findModel(modelName);
    if (!theModel) {
        return res.errWithCode(0, 105);
    }
    var props = theModel.definition.rawProperties;
    var ret = {};
    for (var key in props) {
        var prop = props[key];
        var name = key;
        var required = false;
        var type;
        var model;
        if (key.indexOf('(uz*R*id)') != -1) {
            continue;
        }
        if (modelName === 'user' || modelName === 'User') {
            if (name === 'realm' || name === 'credentials' || name === 'challenges' || name === 'status' || name === 'verificationToken') {
                continue;
            }
        }
        if (modelName === 'roleMapping' || modelName === "RoleMapping") {
            if (name === 'roleId') {
                continue;
            }
        }
        if (prop.type && (typeof prop.type === 'string')) {
            type = prop.type;
            if (prop.isFile) {
                type = "File";
            }
        } else {
            if (key == 'id') {
                type = "String";
            } else {
                if (typeof prop.type === 'function') {
                    type = prop.type.name;
                } else if (typeof prop === 'function') {
                    type = prop.name;
                } else if (Array.isArray(prop)) {
                    type = "Array";
                }
            }
        }
        if (prop.required) {
            required = true;
        }
        ret[name] = {
            name: name,
            type: type,
            required: required
        };
        if (model) {
            ret[name].model = model;
            model = undefined;
        }
    }

    var relations = theModel.definition.settings.relations;
    if (relations) {
        for (var rkey in relations) {
            var rprop = relations[rkey];
            ret[rkey] = {
                name: rkey,
                type: rprop.type == "hasMany" ? "Relation" : "Pointer",
                model: rprop.model
            };
        }
    }

    var propArray = [];
    for (var item in ret) {
        propArray.push(ret[item]);
    }
    var acls = theModel.definition.settings.acls;
    var permissions = explainPermissionsFromAcls(acls);
    return res.ok({
        properties: propArray,
        permissions: permissions
    });
};
function explainPermissionsFromAcls(aclsArray) {
    if (!aclsArray || !Array.isArray(aclsArray)) {
        return {
            create: {"roles": "$everyone"},
            get: {"roles": "$everyone"},
            find: {"roles": "$everyone"},
            update: {"roles": "$everyone"},
            delete: {"roles": "$everyone"},
            execute: {"roles": "$everyone"}
        };
    }
    var acls = {
        create: {roles: [], users: []},
        get: {roles: [], users: []},
        find: {roles: [], users: []},
        update: {roles: [], users: []},
        delete: {roles: [], users: []},
        execute: {roles: [], users: []}
    };
    var others = {}
    for (var i = 0; i < aclsArray.length; i++) {
        var acl = aclsArray[i];
        if (acl && acl.property) {
            switch (acl.property) {
                case "create":
                    if (acl.principalType === "ROLE" && acl.permission === "ALLOW") {
                        if (acl.principalId === "$everyone") {
                            others.create = {"roles": "$everyone"};
                        } else if (acl.principalId === "$owner") {
                            others.create = {"roles": "$owner"};
                        } else {
                            acls.create.roles.push(acl.principalId);
                        }
                    } else if (acl.principalType === "USER" && acl.permission === "ALLOW") {
                        acls.create.users.push((acl.aliasName || acl.principalId));
                    }
                    break;
                case "findById":
                    if (acl.principalType === "ROLE" && acl.permission === "ALLOW") {
                        if (acl.principalId === "$everyone") {
                            others.get = {"roles": "$everyone"};
                        } else if (acl.principalId === "$owner") {
                            others.get = {"roles": "$owner"};
                        } else {
                            acls.get.roles.push(acl.principalId);
                        }
                    } else if (acl.principalType === "USER" && acl.permission === "ALLOW") {
                        acls.get.users.push((acl.aliasName || acl.principalId));
                    }
                    break;
                case "find":
                    if (acl.principalType === "ROLE" && acl.permission === "ALLOW") {
                        if (acl.principalId === "$everyone") {
                            others.find = {"roles": "$everyone"};
                        } else if (acl.principalId === "$owner") {
                            others.find = {"roles": "$owner"};
                        } else {
                            acls.find.roles.push(acl.principalId);
                        }
                    } else if (acl.principalType === "USER" && acl.permission === "ALLOW") {
                        acls.find.users.push((acl.aliasName || acl.principalId));
                    }
                    break;
                case "updateAttributes":
                    if (acl.principalType === "ROLE" && acl.permission === "ALLOW") {
                        if (acl.principalId === "$everyone") {
                            others.update = {"roles": "$everyone"};
                        } else if (acl.principalId === "$owner") {
                            others.update = {"roles": "$owner"};
                        } else {
                            acls.update.roles.push(acl.principalId);
                        }
                    } else if (acl.principalType === "USER" && acl.permission === "ALLOW") {
                        acls.update.users.push((acl.aliasName || acl.principalId));
                    }
                    break;
                case "deleteById":
                    if (acl.principalType === "ROLE" && acl.permission === "ALLOW") {
                        if (acl.principalId === "$everyone") {
                            others.delete = {"roles": "$everyone"};
                        } else if (acl.principalId === "$owner") {
                            others.delete = {"roles": "$owner"};
                        } else {
                            acls.delete.roles.push(acl.principalId);
                        }
                    } else if (acl.principalType === "USER" && acl.permission === "ALLOW") {
                        acls.delete.users.push((acl.aliasName || acl.principalId));
                    }
                    break;
                default:
                    break;
            }
        }
    }
    var arr = ["create", "get", "find", "update", "delete"];
    var returnacls = {};
    for (var i = 0, len = arr.length; i < len; i++) {
        var str = arr[i];
        if (others[str]) {
            if (others[str].roles == "$everyone") {
                returnacls[str] = others[str];
            } else {
                returnacls[str] = [];
                returnacls[str].push(others[str]);
                if (acls[str]) {
                    returnacls[str].push(acls[str]);
                }
            }
        } else if (acls[str]) {
            returnacls[str] = [];
            returnacls[str].push(acls[str]);
        }
    }
    returnacls.execute = {"roles": "$everyone"};
    return returnacls;
}
module.exports = {
    getModelList: getModelList,
    getModelDefinition: getModelDefinition
}