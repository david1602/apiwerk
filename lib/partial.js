/**
 * Functions for partial templates
 */
const { template } = require('./template');
const Immutable = require('seamless-immutable');
const { prompt } = require('inquirer');
const debug = require('./debug');
const camelCase = require('lodash.camelcase');

const createConfig = directory =>
    Immutable({
        directory,
        base: __dirname
    });

const flags = {
    'Get all (GET)': 'get_col',
    'Create new (POST)': 'post_col',
    'Update single (PUT)': 'put_res',
    'Remove single (DELETE)': 'del_res',
    'Get single (GET)': 'get_res'
};

/**
 * Creates a new route
 *
 * @param  {string} directory Working directory
 */
exports.route = async function(directory) {
    debug('Creating a new route in %s', directory);
    const config = createConfig(directory);

    const answers = await prompt([
        {
            type: 'input',
            name: 'base',
            message: 'Route URL',
            validate(str) {
                if (!str.length) return 'That does not look like an URL';

                return true;
            }
        },
        {
            type: 'checkbox',
            name: 'verbs',
            message: 'Supported REST interactions',
            choices: Object.keys(flags)
        }
    ]);

    const complete = answers.verbs.reduce(
        (acc, cur) => acc.set(flags[cur], true),
        config.merge({
            url: answers.base,
            name: camelCase(answers.base)
        })
    );

    await template(complete, 'route.js.hbs', 'templates/partial', `src/routes/${complete.name}.js`);
};

/**
 * Creates a new service
 *
 * @param  {string} directory Working directory
 */
exports.service = async function(directory) {
    debug('Creating a new service in %s', directory);
    const config = createConfig(directory);

    const answers = await prompt([
        {
            type: 'list',
            name: 'type',
            message: 'Type of service',
            choices: [{ name: 'Entity management', value: 'entity' }, { name: 'General', value: 'general' }]
        },
        {
            type: 'input',
            name: 'name',
            message: 'Entity name',
            when(state) {
                return state.type === 'entity';
            },
            validate(input) {
                if (!input || !input.length) return 'Please enter an entity name';

                return true;
            }
        },
        {
            type: 'input',
            name: 'name',
            message: 'Service name',
            when(state) {
                return state.type === 'general';
            },
            validate(input) {
                if (!input || !input.length) return 'Please enter a service name';

                return true;
            }
        }
    ]);

    const complete = config.merge(answers);

    await template(
        complete,
        'entity' === complete.type ? 'entity-service.js.hbs' : 'general-service.js.hbs',
        'templates/partial',
        `src/services/${complete.name.toLowerCase()}.js`
    );
};
