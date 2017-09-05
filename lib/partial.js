/**
 * Functions for partial templates
 */
const { template } = require('./template');
const Immutable = require('seamless-immutable');
const { prompt } = require('inquirer');
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
    const config = createConfig(directory);

    console.log('Create a new route handler');
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

    await template(
        complete,
        'route.js.hbs',
        'templates/partial',
        `src/routes/${complete.name}.js`
    );

    console.log('Route has been created.');
};
