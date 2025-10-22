let chalk = null;

const getChalk = () => {
    if (!chalk) {
        try {
            chalk = require('chalk');
        } catch {
            chalk = {
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
    return chalk;
};

module.exports = getChalk;
