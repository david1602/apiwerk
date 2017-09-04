/**
 * Init sub command
 */
const debug = require('../debug');
const { create } = require('../new');

exports.description =
    'Initializes a new apiwerk project in the current directory';

exports.handler = async function() {
    debug('Running command "init"');

    try {
        await create(process.cwd());
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
