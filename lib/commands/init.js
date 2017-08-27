/**
 * Init sub command
 */
const debug = require('../debug');

exports.description = 'Initializes a new apiwerk project';

exports.options = {
    name: {
        describe: 'Name of the application',
        type: 'string',
        demandOption: true
    }
};

exports.handler = async function(argv) {
    debug('Running command "init"');

    console.log('Initializing apiwerk project "%s"', argv.name);
};
