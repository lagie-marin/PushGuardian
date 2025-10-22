const { default: chalk } = require('chalk');
const { loadConfig } = require('../../core/configManager');
const { execa } = require('execa');
const { constraintEngine } = require('./constraintEngine');
const fs = require('fs');
const path = require('path');
async function constrains(hooksName, message) {
    const config = loadConfig();

    if (config && config.hooks[hooksName]) {
        const constraints = config.hooks[hooksName];
        var checkHooksFct = validateCommitMessage;
        if (constraints) {
            if (hooksName == 'post-checkout') {
                message = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
                checkHooksFct = validateBranchName;
            }
            if (hooksName == 'pre-push') return await validatePrePush();
            const result = await constraintEngine.validate(message, constraints, checkHooksFct);
            if (!result.isValid) {
                console.log(chalk.red('Le message ne respecte pas les contraintes suivantes :'));
                result.errors.forEach((error) => {
                    console.log(chalk.yellow(`\t- ${error}`));
                });
                process.exit(1);
            }
        }
    }
    return { success: true, error: null };
}

async function validateCommitMessage(validationInfo) {
    const errors = [];
    const message = validationInfo.msg;
    const allowedTypes = validationInfo.type;
    const constraintsConfig = validationInfo.constraints;
    let description = '';

    let separator = ': ';
    if (constraintsConfig && constraintsConfig.mustStartWith) {
        separator = constraintsConfig.mustStartWith;
    }

    const commitRegex = new RegExp(`^\\[([^\\]]+)\\](${separator}[\\s\\S]*)$`);
    let match = message.match(commitRegex);

    if (!match && constraintsConfig && constraintsConfig.autoStartWith) {
        const fallbackRegex = /^\[([^\]]+)\](.+)$/;
        match = message.match(fallbackRegex);
        if (match) {
            const correctedMessage = `[${match[1]}]${constraintsConfig.autoStartWith}${match[2].trim()}`;

            try {
                const { stdout: gitDir } = await execa('git', ['rev-parse', '--git-dir']);
                const commitEditMsgPath = path.join(gitDir.trim(), 'COMMIT_EDITMSG');

                if (fs.existsSync(commitEditMsgPath)) {
                    fs.writeFileSync(commitEditMsgPath, correctedMessage);
                    console.log(chalk.green(`✅ Message de commit corrigé automatiquement:\n\t"${correctedMessage}"`));
                    const newValidationInfo = { ...validationInfo, msg: correctedMessage };
                    return await validateCommitMessage(newValidationInfo);
                } else {
                    console.log(
                        chalk.yellow(
                            `Message pas correctement formaté, faite cette commande:\n\tgit commit --amend -m "${correctedMessage}"`
                        )
                    );
                    process.exit(1);
                }
            } catch (error) {
                console.log(chalk.red(`Erreur lors de la correction du message: ${error.message}`));
                console.log(
                    chalk.yellow(
                        `Message pas correctement formaté, faite cette commande:\n\tgit commit --amend -m "${correctedMessage}"`
                    )
                );
                process.exit(1);
            }
        }
    }

    if (!match) {
        errors.push(
            `Le message de commit n'est pas correctement formaté (ex: [TYPE]${separator}message)\n\t\tVotre message: ${message}`
        );
        return { isValid: false, errors, description: message };
    }

    const type = match[1];
    description = match[2];

    if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(type))
        errors.push(`Le type "${type}" n'est pas valide. Types autorisés: ${allowedTypes.join(', ')}`);

    return {
        isValid: errors.length === 0,
        errors,
        description
    };
}

async function validateBranchName(validationInfo) {
    const errors = [];
    let branchDescription = '';

    try {
        const { execa } = require('execa');
        const branchName = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']).then((res) => res.stdout);
        const type = validationInfo.type;
        const match = branchName.match(/^([^/]+)(?:\/(.+))?$/);

        if (match) {
            const branchType = match[1];
            branchDescription = match[2] || '';

            if (type && type.length > 0 && !type.includes(branchType)) {
                errors.push(`Le type de branche "${branchType}" n'est pas valide. Types autorisés: ${type.join(', ')}`);
            }
        }
    } catch (error) {
        console.log('Erreur Git, validation ignorée:', error.message);
    }

    return {
        isValid: errors.length === 0,
        errors,
        branchDescription
    };
}

async function validatePrePush() {
    const { stdout: branch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

    const { stdout: remoteBranches } = await execa('git', ['ls-remote', '--heads', 'origin', branch]);
    const remoteExists = remoteBranches && remoteBranches.includes(branch);

    if (remoteExists) {
        try {
            await execa('git', ['fetch', 'origin', branch, '--depth=1']);

            const { stdout: diff } = await execa('git', ['rev-list', '--count', `${branch}..origin/${branch}`]);
            if (parseInt(diff, 10) > 0) {
                console.log(
                    chalk.red(
                        `/!\\: La branche distante "origin/${branch}" est différente de la branche locale actuelle.`
                    )
                );
                const { stdout: status } = await execa('git', ['status', '--porcelain']);
                if (status.trim().length > 0) {
                    console.log(
                        chalk.red(
                            'Des modifications locales non commit sont présentes.\ngit stash && git pull && git stash pop'
                        )
                    );
                } else {
                    console.log(chalk.red('Veuillez récupérer les changements distants avec : git pull'));
                }
                process.exit(1);
            }
        } catch (error) {
            console.log(chalk.yellow(`Attention: Impossible de vérifier la branche distante (${error.message})`));
        }
    } else {
        console.log(chalk.green(`✅ Nouvelle branche "${branch}" - premier push vers le remote`));
    }

    await execa('npx', ['pushguardian', 'validate', '-s']);
    return { success: true, error: null };
}

module.exports = { constrains, validateCommitMessage, validateBranchName, validatePrePush };
