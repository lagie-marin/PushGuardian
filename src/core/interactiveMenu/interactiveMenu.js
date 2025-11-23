const { getChalk } = require('../../utils/chalk-wrapper');
const chalk = getChalk();

module.exports = (message, choices, preselected = []) => {
    return new Promise((resolve) => {
        let currentIndex = 0;
        let choiseMap = preselected;

        const renderMenu = () => {
            console.clear();
            console.log(chalk.blue(message));
            choices.forEach((choise, index) => {
                if (index == currentIndex) console.log(chalk.yellow(`> ${choise}`));
                else if (index != currentIndex && choiseMap.includes(index)) console.log(chalk.green(`* ${choise}`));
                else console.log(`  ${choise}`);
            });
            console.log('\n▲: Up\t▼: Down\t◀: Unselect\t►: Select (Enter to validate, Ctrl+C to quit)');
        };

        const handleInput = (key) => {
            if (key == '\u001B[A') {
                // UP Arrow
                currentIndex = (currentIndex - 1 + choices.length) % choices.length;
                renderMenu();
            } else if (key == '\u001B[B') {
                // DOWN Arrow
                currentIndex = (currentIndex + 1) % choices.length;
                renderMenu();
            } else if (key == '\r') {
                // ENTER
                process.stdin.setRawMode(false);
                process.stdin.pause();
                executeChoise(choiseMap);
            } else if (key == '\u001B[D') {
                // Left Arrow
                const index = choiseMap.indexOf(currentIndex);
                if (index !== -1) {
                    choiseMap.splice(index, 1);
                }
                renderMenu();
            } else if (key == '\u001B[C') {
                // Rigth Arrow
                choiseMap.push(currentIndex);
                renderMenu();
            } else if (key == '\u0003') {
                // QUIT with Ctrl+C
                process.exit();
            }
        };

        const executeChoise = (choiseMap) => {
            if (!choiseMap.length) {
                resolve([choices[currentIndex]]);
            } else {
                const selectedChoices = choiseMap.map((index) => choices[index]);
                resolve(selectedChoices);
            }
            process.stdin.removeListener('data', handleInput);
            process.stdin.setRawMode(false);
            process.stdin.pause();
        };

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', handleInput);

        renderMenu();
    });
};
