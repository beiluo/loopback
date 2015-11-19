var request = require("request");
var async = require("async");
var host = "http://127.0.0.1:5001";
var ObjectID = require("mongodb").ObjectID;
function findProp(model, name) {
    var prop = model.definition.rawProperties[name]
    if (prop) return prop;
    var relation = model.definition.settings.relations;
    prop = relation && relation[name]
    if (prop) return prop;
    return undefined;
}
function isValid(model) {
    var count = 1;//默认id已经添加index
    Object.keys(model.definition.rawProperties).forEach(function (name) {
        var prop = model.definition.rawProperties[name] || {};
        if (prop.index) {
            count++;
        }
    })

    return count > 1 ? false : true;
}
function createIndex(req, res) {
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var columnName = req.body.columnName;

    var declaringModel;
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    if (!columnName) {
        return res.errWithCode(0, 104);
    }

    declaringModel = registry.findModel(modelName);
    if (!declaringModel) {
        return res.errWithCode(0, 105);
    }

    var props = findProp(declaringModel, columnName);
    if (!props) {
        return res.errWithCode(0, 110);
    }
    if (!isValid(declaringModel)) return res.errWithCode(0, 127);//索引数量不能超过两个

    if (props.type == "GeoPoint") {
        var connector = declaringModel.getConnector();
        declaringModel.count(function (err, count) {
            if (err)  return res.errWithCode(0, 110);
            if (count > 10000) return res.errWithCode(0, 128);//数据量超过10000不允许创建index

            declaringModel.find(function (err, rows) {
                if (err)  return res.errWithCode(0, 110);
                var targets = [];
                rows.forEach(function (row) {
                    var geo = row[columnName];
                    if (geo && !((typeof geo.lat==="number")&&(typeof geo.lng==="number")&& geo.lat < 90 && geo.lat > -90 && geo.lng > -180 && geo.lng < 180)) {
                        var unset = {};
                        unset[columnName]="";
                        targets.push({where: {"_id":ObjectID(row["id"])}, update: {"$unset": unset}});
                    }
                })

                async.each(targets, function (target, next) {
                    declaringModel.updateAll(target.where, target.update, function (err,other) {
                        if (err) return next(err);
                        return next();
                    })
                }, function (err) {
                    if (err) return res.errWithCode(0, 129);//更新数据失败
                    var t = {};
                    t[columnName] = "2d";
                    connector.createIndex(modelName,t, {sparse: true}, function (err,indexName) {
                        if (err) return res.errWithCode(0, 129);
                        updateFile(indexName);
                    })
                })
            })
        })
    } else {
        var t = {};
        t[columnName] = 1;
        connector.createIndex(t, {sparse: true}, function (err,indexName) {
            if (err) return res.errWithCode(0, 129);
            updateFile(indexName);
        })
    }
    function updateFile(indexName) {
        props.index = indexName;
        var options = {
            url: host + "/explorer/fileCreateIndex",
            method: "POST",
            json: {
                "modelName": modelName,
                "columnName": columnName,
                "indexName": indexName
            },
            headers: {
                "x-apicloud-appid": appId
            }
        }
        request(options, function (err, response, body) {
            if (err) return res.errWithCode(0, 125)
            return res.ok("成功");
        })
    }

}

function  dropIndex(req,res){
    var app = req.app;
    var registry = app.registry;
    var appId = req.headers["x-apicloud-appid"];
    var modelName = req.body.modelName;
    var columnName = req.body.columnName;
    var declaringModel;
    if (!appId) {
        return res.errWithCode(0, 101);
    }
    if (!columnName) {
        return res.errWithCode(0, 104);
    }

    declaringModel = registry.findModel(modelName);
    if (!declaringModel) {
        return res.errWithCode(0, 105);
    }

    var props = findProp(declaringModel, columnName);
    if (!props) {
        return res.errWithCode(0, 110);
    }

    if(!props.index){
        return res.errWithCode(0, 130);//不存在的index
    }

    var connector = declaringModel.getConnector();
    connector.dropIndex(modelName,props.index, function (err, result) {
        if (err) return res.errWithCode(0, 129);
        var options = {
            url: host + "/explorer/fileDropIndex",
            method: "POST",
            json: {
                "modelName": modelName,
                "columnName": columnName
            },
            headers: {
                "x-apicloud-appid": appId
            }
        }
        request(options, function (err, response, body) {
            delete  props["index"];
            if (err) return res.errWithCode(0, 125)
            return res.ok("成功");
        })
    })
}

module.exports={
    createIndex:createIndex,
    dropIndex:dropIndex
}