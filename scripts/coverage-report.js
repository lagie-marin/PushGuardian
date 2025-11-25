const fs = require('fs');
const path = require('path');
const { getChalk } = require('../src/utils/chalk-wrapper');

function generateCoverageReport() {
    const chalk = getChalk();
    const coverageFile = path.join(__dirname, '../coverage/coverage-summary.json');

    if (!fs.existsSync(coverageFile)) {
        console.log(chalk.red('❌ Fichier de couverture non trouvé. Exécutez "npm run test:coverage" d\'abord.'));
        process.exit(1);
    }

    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    const total = coverage.total;

    console.log(chalk.bold('\nRapport de Couverture de Tests\n'));
    console.log(chalk.blue('═'.repeat(50)));

    const metrics = [
        { name: 'Statements', value: total.statements },
        { name: 'Branches  ', value: total.branches },
        { name: 'Functions ', value: total.functions },
        { name: 'Lines     ', value: total.lines }
    ];

    metrics.forEach(({ name, value }) => {
        const pct = value.pct;
        const color = pct >= 70 ? chalk.green : pct >= 40 ? chalk.yellow : chalk.red;
        const icon = pct >= 70 ? '✅' : pct >= 40 ? '⚠️ ' : '❌';

        console.log(`${icon} ${name}   : ${color(pct.toFixed(2) + '%')} (${value.covered}/${value.total})`);
    });

    console.log(chalk.blue('═'.repeat(50)));

    const avgCoverage = (total.statements.pct + total.branches.pct + total.functions.pct + total.lines.pct) / 4;
    console.log(chalk.bold(`\nCouverture moyenne : ${avgCoverage.toFixed(2)}%\n`));

    // Objectifs
    const target = 90;
    const diff = target - avgCoverage;

    if (avgCoverage >= target) {
        console.log(chalk.green(`Objectif atteint ! (+${(avgCoverage - target).toFixed(2)}%)`));
    } else {
        console.log(chalk.yellow(`Objectif: ${target}% (encore ${diff.toFixed(2)}% à couvrir)`));
    }

    console.log();

    // Recommandations détaillées
    if (avgCoverage < 30) {
        console.log(chalk.yellow('Priorités urgentes:'));
        console.log(chalk.yellow('   1. Ajouter tests CLI commands (actuellement faible)'));
        console.log(chalk.yellow('   2. Tester Code Quality Tools'));
        console.log(chalk.yellow('   3. Couvrir Mirroring system'));
    } else if (avgCoverage < 50) {
        console.log(chalk.yellow('Améliorations suggérées:'));
        console.log(chalk.yellow("   - Tester les cas d'erreur et edge cases"));
        console.log(chalk.yellow("   - Ajouter tests d'intégration"));
        console.log(chalk.yellow('   - Couvrir les branches conditionnelles'));
    } else if (avgCoverage < 70) {
        console.log(chalk.green('Bonne couverture ! Continuez.'));
        console.log(chalk.yellow('Pour aller plus loin:'));
        console.log(chalk.yellow('   - Tests de performance'));
        console.log(chalk.yellow('   - Tests end-to-end'));
    } else {
        console.log(chalk.green('Excellente couverture de tests !'));
    }

    console.log();
}

generateCoverageReport();
