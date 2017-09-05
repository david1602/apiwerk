const { format, parse } = require('date-fns');

const DATE_FORMAT = 'YYYY-MM-DD';

exports.DATE_FORMAT = DATE_FORMAT;

/**
 * Formats the given date using the given format.
 *
 * @param {string|Date} date Date to format
 * @param {string=} fmt Format, defaults to `YYYY-MM-DD`
 * @return {string} Formatted date
 */
exports.formatDate = function(date, fmt = DATE_FORMAT) {
    const theDate = date && Date === date.constructor ? date : new Date(date);

    return format(theDate, fmt);
};

/**
 * Parses the given date and returns a Date object.
 *
 * @param  {string} date Date to parse
 * @return {Date}      Parsed date
 */
exports.parseDate = function(date) {
    return parse(date);
};
