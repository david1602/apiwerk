/**
 * New sub command
 */
const debug = require('../debug');

exports.description = 'Initializes a new apiwerk project in a new directory';

exports.options = {
    name: {
        describe: 'Name of the application',
        type: 'string',
        demandOption: true
    }
};

exports.handler = async function(argv) {
    debug('Running command "new"');

    console.log('Initializing apiwerk project in folder "%s"', argv.name);
};
