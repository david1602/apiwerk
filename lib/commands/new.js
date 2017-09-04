/**
 * New sub command
 */
const debug = require('../debug');
const { create } = require('../new');
const { resolve } = require('path');

exports.description = 'Initializes a new apiwerk project in a new directory';

exports.options = {
    name: {
        describe: 'Name of the folder for the project',
        type: 'string',
        demandOption: true
    }
};

exports.handler = async function(argv) {
    debug('Running command "new"');

    try {
        await create(resolve(process.cwd(), argv.name));
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
