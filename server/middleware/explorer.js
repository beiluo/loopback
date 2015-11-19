module.exports = function(app,rootAPi) {

    var e_acl = require('./api/acl');
    app.post(rootAPi+'/setModelACL', e_acl);

    var e_column = require('./api/column');
    app.post(rootAPi+"/addColumn", e_column.addColumn);
    app.post(rootAPi+"/removeField", e_column.removeField);
    app.post(rootAPi+"/renameField", e_column.renameField);


    var e_model = require('./api/model');
    app.post(rootAPi+"/createModel", e_model.createModel);
    app.post(rootAPi+"/deleteModel", e_model.deleteModel);

    var e_definition = require('./api/definition');
    app.get(rootAPi+"/getModelList", e_definition.getModelList);
    app.get(rootAPi+"/getModelDefinition/:modelName(*)", e_definition.getModelDefinition);

    var e_row = require("./api/rows");
    app.post(rootAPi+"/deleteAll", e_row.deleteAll);
    app.post(rootAPi+"/deleteRows", e_row.deleteRows);

    var e_info = require("./api/info");
    app.post(rootAPi+"/setSenderEmail", e_info.setSenderEmail);
    app.post(rootAPi+"/setEmailVerify", e_info.setEmailVerify);
    app.post(rootAPi+"/setVerifyInfo", e_info.setVerifyInfo);
    app.post(rootAPi+"/setResetInfo", e_info.setResetInfo);

    var e_index = require("./api/index");
    app.post(rootAPi+"/createIndex",e_index.createIndex);
    app.post(rootAPi+"/dropIndex",e_index.dropIndex);
}