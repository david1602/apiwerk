/**
 * Creates a new apiwerk project in a given folder and handles the setup
 */
const { prompt } = require('inquirer');
const debug = require('./debug');
const Immutable = require('seamless-immutable');
const compose = require('async/compose'); // TODO Replace by another library

// The immutable data store that is used later on to generate the project
const store = Immutable({
    version: void 0,
    name: void 0,
    configuration: {},

    // Temporary stuff
    tmp: {}
});

// Database configuration helpers
// They take the immutable store and store
const databaseHelpers = {
    PostgreSQL(store) {
        // TODO Set postgres config
        return store;
    },

    mongodb(store) {
        // TODO Set mongo config
        return store;
    },

    Redis(store) {
        // TODO Set redis config
        return store;
    }
};

/**
 * Asks for the basics of the application.
 *
 * @param  {object} store Store
 * @return {object}       Next store
 */
const basics = async function(store) {
    debug('Asking for the application basics');

    const result = await prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Name of the application'
        },
        {
            type: 'input',
            name: 'version',
            default: '1.0.0',
            message: 'Version'
        },
        {
            type: 'checkbox',
            name: 'databases',
            message: 'Databases to use',
            choices: ['PostgreSQL', 'Redis', 'mongodb']
        }
    ]);

    return store
        .set('name', result.name)
        .set('version', result.version)
        .setIn(['tmp', 'databases'], Immutable(result.databases));
};

/**
 * Asks the user to configure each of the selected databases
 *
 * @param  {object} store Store
 * @return {object}       Next store
 */
const configureDatabases = async function(store) {
    debug('Preparing databases');
    const dbs = store.tmp.databases;

    return dbs.reduce(async function(st, db) {
        return databaseHelpers[db](st);
    }, store);
};

exports.create = async function(directory) {
    debug('Creating a new apiwerk project in the folder %s', directory);

    const run = compose(configureDatabases, basics);

    const config = await run(store);

    console.warn(config);
};
