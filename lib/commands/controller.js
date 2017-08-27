/**
 * Controller sub command
 */
const debug = require('../debug');

exports.description = 'Creates a new controller';

exports.handler = async function(argv) {
    debug('Running command "init"');

    console.log('Initializing apiwerk project "%s"', argv.name);
};
