/**
 * Root route
 */
const pkg = require('../../package.json');
const { info } = require('../services/log');

const getRoot = function(req, res) {
    info('Serving root...');
    res.json({
        version: pkg.version
    });
};

module.exports = function(server) {
    server.get('/', getRoot);
};
