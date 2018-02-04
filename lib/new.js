/**
 * Creates a new apiwerk project in a given folder and handles the setup
 */
const { prompt } = require('inquirer');
const debug = require('./debug');
const Immutable = require('seamless-immutable');
const compose = require('compose-await');
const { basename } = require('path');
const { templateTree } = require('./template');
const version = require('latest-version');

// The immutable data store that is used later on to generate the project
const store = Immutable({
    version: void 0,
    name: void 0,
    configuration: {},
    base: __dirname,

    // Temporary stuff
    tmp: {},

    // List of packages to be installed
    packages: [
        'ava',
        'better-npm-run',
        'body-parser',
        'eslint',
        'express',
        'express-catch',
        'date-fns',
        'fs-extra',
        'glob-promise',
        'jsonwebtoken',
        'lodash',
        'multer',
        'nodemon',
        'prettier',
        'prunk',
        'seamless-immutable',
        'winston'
    ],

    // List of regex for the templates to ignore
    ignoreRegexes: ['\\.DS_Store', 'Thumbs.db', '\\.git', 'node_modules']
});

/**
 * Adds a package to be installed to the store.
 *
 * @param  {object} store   Immutable store
 * @param  {string} pkg Package to add
 * @return {object}         Next immutable store
 */
const addPackageToStore = function(store, pkg) {
    return store.update(
        'packages',
        packages => packages.concat(Immutable([pkg])) // One cannot use .push
    );
};

/**
 * Adds a list of packages to be installed to the store.
 *
 * @param  {object} store   Immutable store
 * @param  {array<string>} packages Packages to add
 * @return {object}         Next immutable store
 */
const addPackagesToStore = function(store, packages) {
    return packages.reduce((str, pkg) => addPackageToStore(str, pkg), store);
};

/**
 * Prompts for a connection string, updates the config accordingly and
 * adds the packages to the package list.
 *
 * @param  {string} dbName     Human readable name of the database
 * @param  {string} prefix     Connection string prefix (e.g. 'postgres://')
 * @param  {string} configName Field in the config where the con str should be stored
 * @param  {array<string>} packages   Packages to be installed for this connection
 * @return {function}            Callback function for inquirer
 */
const promptConnectionString = function(dbName, prefix, configName, packages) {
    return async function(store) {
        const { constr } = await prompt([
            {
                type: 'input',
                name: 'constr',
                message: `${dbName} connection string, format: user:password@host:port/database`,
                validate(str) {
                    if (!str.length || !str.includes('@')) return 'That does not look like a valid connection string';

                    return true;
                },
                filter(str) {
                    if (str.startsWith('${prefix}')) return str;

                    return `${prefix}${str}`;
                }
            }
        ]);

        return addPackagesToStore(store.setIn(['configuration', configName], constr), packages);
    };
};

// Database configuration helpers
// They take the immutable store and store
const databaseHelpers = {
    PostgreSQL: promptConnectionString('PostgreSQL', 'postgres://', 'postgres', ['pg-promise']),

    mongodb: promptConnectionString('mongodb', 'mongodb://', 'mongodb', ['mongodb']),

    Redis: promptConnectionString('Redis', 'redis://', 'redis', ['ioredis'])
};

// Regex for the migration/seeding folders of database connections
// Mapping:
//  configkey => regex
// Must be strings because of seamless-immutable
const databaseFolders = {
    mongodb: '^database/mongodb',
    postgres: '^database/postgres'
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
                    if (!str.length) return 'The given application name is not valid';

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
                type: 'input',
                name: 'description',
                message: 'Description'
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author'
            },
            {
                type: 'list',
                name: 'license',
                message: 'License',
                choices: ['Apache-2.0', 'MIT', 'GPL-3.0', 'UNLICENSED', 'Other license']
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
            .set('description', result.description)
            .set('license', result.license)
            .set('author', result.author)
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
    let result = store;

    for (let i = 0; i < dbs.length; i++) result = await databaseHelpers[dbs[i]](result);

    return Object.keys(databaseFolders).reduce((st, db) => {
        if (st.configuration[db]) return st;

        return st.update('ignoreRegexes', ir => ir.concat([databaseFolders[db]]));
    }, result);
};

/**
 * Determines the latest version for every package in the package
 * list
 *
 * @param  {object} store Immutable store
 * @return {object}       Next immutable store
 */
const determineVersions = async function(store) {
    const { packages } = store;
    let withVersions = store;

    for (let i = 0; i < packages.length; i++) {
        debug('Determining version for %s ...', packages[i]);
        const ver = await version(packages[i]);

        debug('-> %s', ver);
        withVersions = withVersions.updateIn(['packages', i], name => ({
            name,
            version: ver
        }));
    }

    return withVersions;
};

/**
 * Creates a new apiwerk project in the given directory
 *
 * @param  {string} directory Absolute path of the directory
 */
exports.create = async function(directory) {
    debug('Creating a new apiwerk project in the folder %s', directory);

    const run = compose(determineVersions, configureDatabases, basics(directory));
    const base = store.merge({
        directory
    });

    const config = await run(base);

    await templateTree(config, 'templates/blueprint');

    console.log(`
*** Your project has been initialized

The desired options have been configured and
dependencies have been added to the package.json file

Next steps:

- Take a look at src/services/config.js to make sure your configuration
  is correct
- Take a look at the LICENSE file to make sure the license is correct
- Run 'npm install' or 'yarn' respectively to install dependencies
- Run 'npm start' or 'yarn start' respectively to start the application
- Run 'npm test' or 'yarn test' respectively to run tests

Thanks for using apiwerk. Happy hacking.
`);
};
