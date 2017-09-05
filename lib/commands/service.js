/**
 * Servuce sub command
 */
const debug = require('../debug');
const { service } = require('../partial');

exports.description = 'Creates a new service';

exports.handler = async function() {
    debug('Running command "service"');

    try {
        await service(process.cwd());
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
