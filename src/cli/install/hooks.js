const { default: chalk } = require('chalk');
const fs = require('fs');
const path = require('path');
const createPushGuardianConfig = require('../../core/createPushGuardianConfig');

function installHooks(hooks = ['pre-push'], force = false) {
    const hooksDir = path.join(process.cwd(), '.git', 'hooks');

    console.log(chalk.blue('📦 Installation des hooks Git...'));

    if (!fs.existsSync(hooksDir)) {
        console.error('❌ Répertoire .git/hooks non trouvé');
        return false;
    }

    hooks.forEach((hook) => {
        const hookPath = path.join(hooksDir, hook);

        if (fs.existsSync(hookPath) && !force) {
            console.error(`⚠️  Hook ${hook} existe déjà. Use --force pour écraser`);
            return;
        }

        const hookContent = `#!/bin/sh
# PushGuardian ${hook} hook
npx pushguardian validate --hooks ${hook} ${hook == 'commit-msg' ? '"$(cat "$1")"' : ''} || exit 1
`;

        try {
            fs.writeFileSync(hookPath, hookContent);
            fs.chmodSync(hookPath, '755');
            console.log(chalk.green(`✅ Hook ${hook} installé avec succès!`));
        } catch (error) {
            console.error(`❌ Erreur lors de l'installation du hook ${hook}:`, error.message);
        }
    });

    console.log(chalk.cyan('💡 Les validations se déclencheront automatiquement sur les hooks configurés.'));
    createPushGuardianConfig();
    return true;
}

module.exports = { installHooks };
