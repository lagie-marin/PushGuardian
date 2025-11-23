const { getChalk } = require('../utils/chalk-wrapper');
const chalk = getChalk();

module.exports = (error) => {
    const stackLines = error.stack.split('\n');
    const location = stackLines[1] ? stackLines[1].trim() : 'Emplacement inconnu';
    console.log(chalk.red('💥 Error during validation:'), error.message, location);
    process.exit(1);
};
