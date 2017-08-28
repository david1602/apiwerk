/**
 * Creates a new apiwerk project in a given folder and handles the setup
 */
const { prompt } = require('inquirer');
const debug = require('./debug');
const Immutable = require('seamless-immutable');
const compose = require('compose-await');
const { basename } = require('path');

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
    PostgreSQL: async function(store) {
        const { constr } = await prompt([
            {
                type: 'input',
                name: 'constr',
                message:
                    'Connection string, format: user:password@host:port/database',
                validate(str) {
                    if (!str.length || !str.includes('@'))
                        return 'That does not look like a valid connection string';

                    return true;
                },
                filter(str) {
                    if (str.startsWith('postgres://')) return str;

                    return `postgres://${str}`;
                }
            }
        ]);

        return store.setIn(['configuration', 'postgres'], constr);
    },

    mongodb: async function(store) {
        // TODO Set mongo config
        return store;
    },

    Redis: async function(store) {
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
const basics = name =>
    async function(store) {
        debug('Asking for the application basics');

        const result = await prompt([
            {
                type: 'input',
                name: 'name',
                default: basename(name),
                message: 'Name of the application',
                validate(str) {
                    if (!str.length)
                        return 'The given application name is not valid';

                    return true;
                }
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

    const run = compose(configureDatabases, basics(directory));

    const config = await run(store);

    console.warn(config);
};
