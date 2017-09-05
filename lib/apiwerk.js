/**
 * The apiwerk core
 */
const glob = require('glob-promise');
const yargs = require('yargs');
const pkg = require('../package.json');
const debug = require('./debug');

exports.main = async function() {
    debug('Running apiwerk version %s', pkg.version);
    // Find and load all commands
    const commandFiles = await glob(__dirname + '/commands/*.js');

    commandFiles
        .map(file => ({ file, export: require(file) }))
        .forEach(command => {
            const name = command.file.match(/\/([a-z]*)\.js$/i)[1];
            debug('Registering %s', name);

            yargs.command(
                name,
                command.export.description,
                command.export.options || {},
                command.export.handler
            );
        });

    yargs.version(pkg.version).help().demandCommand().recommendCommands().argv;
};
