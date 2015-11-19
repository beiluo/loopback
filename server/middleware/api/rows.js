var mongodb = require('mongodb');
function deleteAll(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var theDB;
    var theModel;
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    theModel = registry.findModel(modelName);
    if (!theModel) {
        return res.errWithCode(0, 105);
    }
    theModel.deleteAll(function (err) {
        if (err) {
            return res.errWithCode(0, 112);
        }
        res.ok("删除成功");
    });
}

function deleteRows(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var rowIds = req.body.rowIds;
    var theModel;
    if (!appId) {
        return res.errWithCode(0, 101);
    }

    theModel = registry.findModel(modelName);
    if (!theModel) {
        return res.errWithCode(0, 105);
    }
    if (!rowIds) {
        return res.errWithCode(0, 112);
    }
    var idArray = rowIds.split(',');
    var _in = [];
    idArray.forEach(function (id) {
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
            _in.push(new mongodb.ObjectID(id));
        }
    })

    theModel.destroyAll({"id": {"in": _in}}, function (err) {
        if (err) {
            return res.errWithCode(0, 112);
        }
        return res.ok("删除成功");
    });
}

module.exports={
    deleteAll:deleteAll,
    deleteRows:deleteRows
}