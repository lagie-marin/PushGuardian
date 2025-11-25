#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const VERSION = '0.0.1';
const program = new Command();
const fs = require('fs');

program.name('pushguardian').description('🛡️ PushGuardian - Système de validation CI/CD').version(VERSION);

const commandsDir = path.join(__dirname, 'command');
fs.readdirSync(commandsDir).forEach((file) => {
    const command = require(path.join(commandsDir, file));
    const cmd = program.command(command.name).description(command.description);

    if (command.arguments) command.arguments.forEach((arg) => cmd.argument(arg.name, arg.description));

    if (command.options) command.options.forEach((opt) => cmd.option(opt.flags, opt.description));
    cmd.action(command.action);
});

program.showHelpAfterError("(utilisez --help pour plus d'informations)");
program.parse(process.argv);
