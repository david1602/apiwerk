/**
 * Tests for the validation service
 */
const validation = require('../validation');
const test = require('ava');

const genString = (length, chr = '#') =>
    Array.apply(null, Array(length)).map(() => chr).join('');

test('makeValidator', t => {
    t.plan(5);
    t.is(typeof validation.makeValidator, 'function');

    const valid = validation.makeValidator({
        a: 'date',
        b: [['string', 1], 'optional'],
        c: [['string', 12]]
    });

    t.is(typeof valid, 'function');

    t.true(
        valid({
            a: '1970-01-01',
            b: 'test',
            c: 'kkjd8811093mhjdkeand'
        })
    );

    t.true(
        valid({
            a: '1980-01-01',
            c: 'kkjd8811093mhjdkeand!'
        })
    );

    t.false(valid({}));
});

// Test the validation functions
test('userId', t => {
    t.plan(8);

    t.is(typeof validation.userId, 'function');
    t.true(validation.userId('8713aj31'));
    t.false(validation.userId(null));
    t.false(validation.userId(void 0));
    t.false(validation.userId(''));
    t.false(validation.userId('1'));
    t.false(validation.userId('aa'));

    t.false(validation.userId(genString(165)));
});

test('password', t => {
    t.plan(14);

    t.is(typeof validation.password, 'function');

    for (let i = 0; i < 8; i++) t.false(validation.password(genString(i)));

    t.true(validation.password('jaldjlasjdlkafjkl;sa'));
    t.true(validation.password('1893rh1!!@#'));
    t.true(validation.password('jkfuih3jkrh2e# $!#9889hn _!)Asrkj23'));

    t.false(validation.password(genString(65)));
    t.true(validation.password(genString(64)));
});

test('string', t => {
    t.plan(13);

    t.is(typeof validation.string, 'function');

    [null, void 0, 3, function() {}, {}, [], 4.5, true, false].forEach(what =>
        t.false(validation.string(what, 0))
    );

    t.true(validation.string('test', 4));
    t.false(validation.string('test', 5));
    t.true(validation.string('test', 1));
});

test('object', t => {
    t.plan(11);

    t.is(typeof validation.object, 'function');

    [null, void 0, 3, function() {}, [], 4.5, true, false].forEach(what =>
        t.false(validation.object(what))
    );

    t.true(validation.object({}));
    t.false(validation.object('{}'));
});

test('number', t => {
    t.plan(13);

    t.is(typeof validation.number, 'function');
    [null, void 0, function() {}, [], {}, true, false, NaN].forEach(what =>
        t.false(validation.number(what))
    );

    t.true(validation.number(3));
    t.true(validation.number(5.6));
    t.true(validation.number(-12));
    t.true(validation.number(-99.31));
});

test('oneOf', t => {
    t.plan(7);

    t.is(typeof validation.oneOf, 'function');

    t.true(validation.oneOf('a', ['a', 'b']));
    t.true(validation.oneOf('a', ['b', 'a']));
    t.true(validation.oneOf('a', 'ab'));
    t.true(validation.oneOf('a', 'ba'));

    t.false(validation.oneOf('5', [4, 5, 6]));
    t.false(validation.oneOf('5', ['44', '55', '66']));
});

test('date', t => {
    t.is(typeof validation.date, 'function');

    ['1970-01-01', '2073-01-04', 'March 06, 2017'].forEach(d =>
        t.true(validation.date(d))
    );

    [null, void 0, function() {}, [], {}, true, false, NaN].forEach(what =>
        t.false(validation.date(what))
    );

    t.true(validation.date(new Date()));
    t.false(validation.date(new Date('jlakdkdaslajsldj')));
});

test('objectId', t => {
    t.plan(30);

    t.is(typeof validation.objectId, 'function');
    t.true(validation.objectId('507f1f77bcf86cd799439011'));
    t.false(validation.objectId(null));
    t.false(validation.objectId(void 0));
    t.false(validation.objectId(''));

    // 23 tests
    '507f1f77bcf86cd79943901'.split('').reduce((acc, cur) => {
        t.false(validation.objectId(acc));
        return acc + cur;
    }, '');

    t.false(validation.objectId(genString(25, 'a')));
    t.true(validation.objectId(genString(24, 'a')));
});

test('email', t => {
    const positives = [
        'robert@bober.com',
        'noreply@customerservice.com',
        'info@example.org',
        'info@example.cn',
        'support@example.org'
    ];
    const negatives = [
        null,
        void 0,
        NaN,
        function() {},
        '',
        'a',
        'eadsd',
        3,
        6,
        -12,
        'haxxor12@name.fakenews'
    ];

    t.plan(positives.length + negatives.length + 1);

    t.is(typeof validation.email, 'function');

    positives.forEach(p => t.true(validation.email(p)));
    negatives.forEach(p => t.false(validation.email(p)));
});
