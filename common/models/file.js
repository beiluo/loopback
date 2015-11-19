module.exports = function(File) {

    // Workaround for https://github.com/strongloop/loopback/issues/292
    File.definition.rawProperties.created.default =
        File.definition.properties.created.default = function() {
            return new Date();
        };
};
