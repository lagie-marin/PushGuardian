<<<<<<< HEAD
let chalk = null;

const getChalk = () => {
    if (!chalk) {
        try {
            chalk = require('chalk');
        } catch {
            chalk = {
=======
let _chalk = null;

const getChalk = () => {
    if (!_chalk) {
        try {
            const { default: chalk } = require('chalk');

            _chalk = chalk;
        } catch {
            _chalk = {
>>>>>>> feat/tests
                red: (text) => text,
                green: (text) => text,
                yellow: (text) => text,
                blue: (text) => text,
                cyan: (text) => text,
                magenta: (text) => text,
                white: (text) => text,
                gray: (text) => text,
                black: (text) => text
            };
        }
    }
<<<<<<< HEAD
    return chalk;
};

module.exports = getChalk;
=======
    return _chalk;
};

module.exports = { getChalk };
>>>>>>> feat/tests
