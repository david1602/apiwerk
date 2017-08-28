/**
 * Init sub command
 */
const debug = require('../debug');
const { create } = require('../new');

exports.description =
    'Initializes a new apiwerk project in the current directory';

exports.handler = async function(argv) {
    debug('Running command "init"');

    await create(process.cwd());
};
