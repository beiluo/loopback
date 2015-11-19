var request = require("request");
var host = "http://127.0.0.1:801";
function createModel(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var base = req.body.base;
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    if (!(/^[a-zA-Z][a-zA-Z0-9_]*$/).test(modelName)) {
        return res.errWithCode(0, 106);
    }
    if (registry.findModel(modelName)) {
        return res.errWithCode(0, 107);
    }
    var setting = {
        dataSource: "mongodb",
        public: true,
        options: {
            plural: modelName
        },
        properties: {
            id: {type: "String", id: true},
            createdAt: {
                type: "Date"
            },
            updatedAt: {
                type: "Date"
            }
        }
    };
    if (base) {
        setting.options.base = base;
    }
    var options = {
        url: host + "/explorer/fileCreateModel",
        method: "POST",
        json: {
            "modelName": modelName,
            "setting": setting
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        if (err) return res.errWithCode(0, 107);
        app.model(modelName, setting);
        return res.json(body);
    })
}
function deleteModel(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var modelNameLow = modelName.toLowerCase();
    var theDB;
    var theModel;
    if (!appId) {
        return res.errWithCode(0, 101);
    }

    theModel = registry.findModel(modelName);
    if (!theModel) {
        return res.errWithCode(0, 105);
    }
    if (["user", "file", "role", "accesstoken", "rolemapping"].indexOf(modelNameLow) != -1) {
        return res.errWithCode(0, 109);
    }

    var options = {
        url: host + "/explorer/fileDeleteModel",
        method: "POST",
        json: {
            "modelName": modelName,
        },
        headers: {
            "x-apicloud-appid": appId
        }
    }
    request(options, function (err, response, body) {
        if (err) return res.errWithCode(0, 125);
        theDB = app.dataSources['mongodb'];
        theDB.automigrate(modelName, function () {
            theModel.deleteAll(function (err) {
                if (err) {
                    return res.errWithCode(0, 111);
                }
                registry.findAndRemoveModel(modelName);
                theModel = null;

                return res.json(body);
            });
        });
    })

}

module.exports = {
    createModel: createModel,
    deleteModel: deleteModel
}