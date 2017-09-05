/**
 * Route sub command
 */
const debug = require('../debug');
const { route } = require('../partial');

exports.description = 'Creates a new route handler';

exports.handler = async function() {
    debug('Running command "route"');

    try {
        await route(process.cwd());
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
