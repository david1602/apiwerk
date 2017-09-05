/**
 * Validation utilities
 */
const { debug } = require('./log');
const { parse, isValid } = require('date-fns');

const passwordRegex = /^.{8,64}$/;
const emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
const useridRegex = /^.{3,64}$/;
const objectIdRegex = /^[a-z0-9]{24}$/i;

/**
 * Determines if the given string matches the given regular expression.
 *
 * @param {string} what String to check
 * @param {RegExp} regex Regular expression
 * @return {boolean}
 */
const matches = (what, regex) => null !== what.match(regex);

/**
 * Creates a function that checks a given string agains the given
 * regular expression.
 *
 * @param {RegExp} regex Regular expression
 * @return {function} Function that checks
 */
const matcher = regex => what =>
    'undefined' !== typeof what && null !== what && matches('' + what, regex);

/**
 * Given a spec, returns a function that validates a given object.
 *
 * A spec is a mapping of the field name to
 * a) a function
 * b) a name of a built-in validation function
 * c) an array of functions or strings
 * d) an array of function invokation definitions
 *
 * Examples:
 *
 * const isValid = makeMatcher({
 *   username: 'username',                      // Built-in validator 'username'
 *   newsletter: 'boolean',                     // Built-in validator 'boolean'
 *   age: [['integer', 21, 65], 'optional'],    // Built-in validator 'integer' applied as integer(theValue, 21, 65). Field is optional
 *   surname: () => true,                       // Custom function
 *   forename: ['optional', [() => false, 5]]   // Custom function with additional argument and optional field
 * });
 *
 * isValid({username: 'john', newsletter: true}); // true
 * isValid({username: 'john', newsletter: false, age: 20 }) // false
 *
 * The key of the spec is the key of the object to be validated.
 *
 * @param {object} spec Validation spec
 * @param {object=} options Configration options
 * @param {boolean=} options.strict Strict mode? Will fail if the nubmer of keys is different.
 * @return {function} Function that expects an object
 */
exports.makeValidator = function(spec, options = {}) {
    const validatedFields = Object.keys(spec);

    // Normalize the spec
    const validators = validatedFields.reduce(function(validatorList, field) {
        const fns = (Array.isArray(spec[field])
            ? spec[field]
            : [spec[field]]).map(function(validator) {
            const validatorDef = Array.isArray(validator)
                ? validator
                : [validator];
            const fn = validatorDef[0];

            if ('optional' === fn) return fn;

            if ('string' === typeof fn)
                return [exports[fn]].concat(validatorDef.slice(1));

            if ('function' === typeof fn) return validatorDef;

            throw new Error('Invalid function: ' + fn);
        });
        const isOptional = fns.includes('optional');

        // Reduce the validators down to an array
        return validatorList.concat([
            function(body) {
                const value = body[field];

                // Check if it is optional
                if ('undefined' === typeof value && isOptional) {
                    if (__DEV__) debug('Skipping optional field %s', field);
                    return true;
                }

                // Execute all validators
                return fns.every(def => {
                    if ('optional' === def) return true;

                    const fn = def[0];
                    const args = [value]
                        .concat(def.slice(1))
                        .concat(body, field);

                    if (__DEV__) {
                        const valid = fn.apply(null, args);

                        if (!valid) debug('Validation failed', field, args);

                        return valid;
                    }

                    return fn.apply(null, args);
                });
            }
        ]);
    }, []);

    return function(body) {
        if (
            options.strict &&
            !validatedFields.length === Object.keys(body).keys
        ) {
            if (__DEV__)
                debug(
                    'Validation: Invalid; different number of keys in strict mode (spec: %s | body: %s)',
                    validatedFields.length,
                    Object.keys(body).length
                );
            return false;
        }

        return validators.every(validator => validator(body));
    };
};

/**
 * Creates a middleware that validates a request's body using the given
 * spec.
 * Will respond with a '400 BAD REQUEST' if the body is invalid.
 *
 * @param {object} spec Validation spec
 * @return {function} Middleware function
 */
exports.validateRequest = function(spec) {
    const valid = exports.makeValidator(spec);

    return function(req, res, next) {
        if (!valid(req.body)) return res.status(400).end();

        next();
    };
};

/* Validator functions */

exports.userId = matcher(useridRegex);
exports.password = matcher(passwordRegex);
exports.string = function(what, length = 0) {
    if ('string' !== typeof what) return false;

    return what.length >= length;
};
exports.object = what =>
    'object' === typeof what && null !== what && !Array.isArray(what);
exports.number = function(what, min = -Infinity, max = Infinity) {
    if ('number' !== typeof what || isNaN(what)) return false;

    return what >= min && what <= max;
};
exports.oneOf = function(what, list) {
    return list.includes(what);
};
exports.date = function(what) {
    return (
        ('string' === typeof what || what instanceof Date) &&
        isValid(parse(what))
    );
};
exports.objectId = matcher(objectIdRegex);
exports.email = matcher(emailRegex);
