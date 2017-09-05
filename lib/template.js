/**
 * Templating functions
 */
const Handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');
const debug = require('./debug');

const removeHbs = function(name) {
    if (name.endsWith('.hbs')) return name.substring(0, name.length - 4);

    return name;
};

// Helper that renders the package list for the package.json file
Handlebars.registerHelper('packageList', function(packages) {
    if (!packages || !packages.length) return '';

    return new Handlebars.SafeString(
        packages
            .asMutable()
            .map(pkg => `"${pkg.name}": "~${pkg.version}"`)
            .join(',\n')
    );
});

// Helper for comparisons
Handlebars.registerHelper('is', function(a, b) {
    return a === b;
});

// Helper that renders the current year
Handlebars.registerHelper('year', function() {
    return new Date().getYear() + 1900;
});

/**
 * Templates the given file
 *
 * @param  {object} config       Configuration
 * @param  {string} filepath     Relative path of the file to `templatesDir` which
 *                               itself is relative to config.base
 * @param  {string} templatesDir Path of the template folder
 */
exports.template = async function(config, filepath, templatesDir) {
    const { directory, base } = config;
    const source = path.resolve(base, templatesDir, filepath);
    const dest = path.resolve(directory, removeHbs(filepath));

    debug('%s -> %s', source, dest);

    // Make sure the directory tree exists
    await fs.ensureDir(path.dirname(dest));

    // Read the source file
    const contents = await fs.readFile(source);
    const tpl = Handlebars.compile(contents.toString());
    const result = tpl(config);

    if (result && result.length) await fs.writeFile(dest, result);
    else debug('Skipped because result is empty');
};

/**
 * Processes a whole file tree
 *
 * @param  {object} config            Configuration
 * @param  {string} templateDirectory Directory to traverse
 */
exports.templateTree = async function(config, templateDirectory) {
    const { ignoreRegexes } = config;
    const files = await glob('**/*', {
        cwd: path.resolve(__dirname, templateDirectory),
        dot: true,
        nodir: true
    });

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Make sure the file is not ignored
        if (ignoreRegexes.some(r => !!file.match(r))) {
            debug('Ignoring file %s', file);
            continue;
        }

        await exports.template(config, file, templateDirectory);
    }
};