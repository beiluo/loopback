var request = require("request");
var host = "http://127.0.0.1:801";
function addColumn(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var columnName = req.body.columnName;
    var columnType = req.body.columnType;
    var columnTarget = req.body.columnTarget;
    var declaringModel, targetModel;
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    if (!columnName) {
        return res.errWithCode(0, 104);
    }
    if (!columnType) {
        columnType = 'String';
    }

    declaringModel = registry.findModel(modelName);
    if (!declaringModel) {
        return res.errWithCode(0, 105);
    }

    var props = findProp(declaringModel,columnName);
    if (props) {
        return res.errWithCode(0, 110);
    }
    if (columnType == "Pointer" || columnType == "Relation") {
        if (!columnTarget) {
            return res.errWithCode(0, 104);
        }
        targetModel = registry.findModel(columnTarget);
        if (!targetModel) {
            return res.errWithCode(0, 104);
        }
    }

    var options = {
        url: host + "/explorer/fileAddColumn",
        method: "POST",
        json: {
            "modelName": modelName,
            "columnName": columnName,
            "columnType":columnType,
            "columnTarget":columnTarget
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        if (err) return res.errWithCode(0, 125)
        if (columnType == "Pointer") {
            declaringModel.belongsTo(targetModel, {foreignKey: columnName, as: columnName + 'Pointer'});
        } else if (columnName == "Relation") {
            var camelizeModelName = i8n.camelize(declaringModel.modelName, true);
            var fk = camelizeModelName + '(uz*R*id)';
            declaringModel.hasMany(targetModel, {as: columnName, foreignKey: fk});

        } else {
            var typeObj = {type: columnType};
            if (columnType === 'File') {
                typeObj = {type: "Object", isFile: true}
            }
            declaringModel.defineProperty(columnName, typeObj);
        }
        return res.ok("成功");
    })
}
function removeField(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var fieldName = req.body.fieldName;

    if (!appId) {
        return res.errWithCode(0, 101);
    }
    if (!modelName || !fieldName) {
        return res.errWithCode(0, 104);
    }

    var theModel = registry.findModel(modelName);
    if (!theModel) {
        return res.errWithCode(0, 105);
    }
    if (theModel.getDataSource().ready(theModel, arguments)) {
        return;// res.errWithCode(0, 114);
    }
    var modelPropertie = findProp(theModel,fieldName);
    if (!modelPropertie)  return res.errWithCode(0, 114);

    var options = {
        url: host + "/explorer/fileRemoveField",
        method: "POST",
        json: {
            "modelName": modelName,
            "fieldName": fieldName
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }

    request(options, function (err, response, body) {
        if (err) return res.errWithCode(0, 125);

        var currentConnector, removeFieldName;
        if (modelPropertie.type === "Relation") {
            var otherModel = registry.findModel(modelPropertie.model);
            if (otherModel) {
                removeFieldName = modelPropertie.foreignKey;
                currentConnector = otherModel.getDataSource().connector;
            }
            theModel.removeHasMany(fieldName);
        } else if (modelPropertie.type === "Pointer") {
            removeFieldName = modelPropertie.foreignKey;
            currentConnector = theModel.getDataSource().connector;
            theModel.removeBelongsTo(fieldName + "Pointer");
        } else {
            removeFieldName = fieldName;
            currentConnector = theModel.getDataSource().connector;
            theModel.removeProperty(fieldName);
        }
        var data = {};
        if (removeFieldName) {
            data[removeFieldName] = 1;
            currentConnector.removeField(modelName, {}, data, function (err, count) {
                if (err) {
                    return res.err("删除列失败");
                }
                return res.ok("删除列成功");
            });
        } else {
            return res.ok("删除列成功");
        }
    })
}
function findProp(model, name) {
    var prop = model.definition.rawProperties[name]
    if (prop) return prop;
    var relation = model.definition.settings.relations;
    prop = relation && relation[name]
    if (prop) return prop;
    return undefined;
}
function renameField(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var fieldName = req.body.fieldName;
    var renameName = req.body.renameFieldName;

    if (!modelName || !fieldName || !renameName) {
        return res.errWithCode(0, 104);
    }

    var theModel = registry.findModel(modelName);
    if (!theModel) {
        return res.errWithCode(0, 105);
    }
    if (theModel.getDataSource().ready(theModel, arguments)) {
        return;// res.errWithCode(0, 114);
    }
    var renameNameProp = findProp(theModel,renameName);
    if (renameNameProp) {
        return res.errWithCode(0, 110);
    }
    var modelPropertie = findProp(theModel,fieldName);
    if (!modelPropertie)  return res.errWithCode(0, 114);
    var options = {
        url: host + "/explorer/fileRenameField",
        method: "POST",
        json: {
            "modelName": modelName,
            "fieldName": fieldName,
            "renameFieldName": renameName
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        switch (modelPropertie.type) {
            case "Relation":
                theModel.removeHasMany(fieldName);
                theModel.hasMany(modelPropertie.model, {as: renameName, foreignKey: modelPropertie.foreignKey});
                break;
            case "Pointer":
                theModel.removeBelongsTo(fieldName + "Pointer");
                theModel.belongsTo(modelPropertie.model, {foreignKey: renameName, as: renameName + 'Pointer'});
                break
            default :
                theModel.removeProperty(fieldName);
                theModel.defineProperty(renameName, modelPropertie);
        }
        var data = {};
        data[fieldName] = renameName;
        theModel.getDataSource().connector.renameField(modelName, {}, data, function (err, count) {
            if (err) {
                return res.err("重命名列失败");
            }
            return res.ok("重命名列成功");
        });
    })
}
module.exports = {
    addColumn: addColumn,
    removeField: removeField,
    renameField: renameField
}