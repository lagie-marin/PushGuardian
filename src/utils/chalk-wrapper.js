let _chalk = null;

const getChalk = () => {
    if (!_chalk) {
        try {
            const { default: chalk } = require('chalk');

            _chalk = chalk;
        } catch {
            _chalk = {
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
    return _chalk;
};

module.exports = { getChalk };
