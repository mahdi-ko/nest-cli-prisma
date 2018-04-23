const inquirer = require('inquirer');
const chalk = require('chalk');
const { strings } = require('@angular-devkit/core');
const { Collection, CollectionFactory, SchematicOption } = require('../lib/schematics')
const { PackageManager, PackageManagerFactory } = require('../lib/package-managers');
const { messages } = require('../lib/ui');

module.exports = (args, options, logger) => {
  logger.debug(chalk.blue('[DEBUG] - new command -'), args, options);
  return askForMissingInformation(args, logger)
    .then(() => executeSchematic(args, options, logger))
    .then(() => {
      if (!options[ 'dryRun' ]) {
        logger.info();
        return selectPackageManager();
      }
    })
    .then((packageManager) => installPackages(packageManager, strings.dasherize(args.name), logger));
};

function askForMissingInformation(args, logger) {
  logger.info();
  logger.info(messages.PROJECT_INFORMATION_START);
  logger.info(messages.ADDITIONAL_INFORMATION);
  logger.info();

  const prompt = inquirer.createPromptModule();
  const questions = [];
  if (args.name === undefined) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'name :',
      default: 'nestjs-app-name'
    });
  }
  if (args.description === undefined) {
    questions.push({
      type: 'input',
      name: 'description',
      message: 'description :',
      default: 'description'
    });
  }
  if (args.version === undefined) {
    questions.push({
      type: 'input',
      name: 'version',
      message: 'version :',
      default: '1.0.0'
    });
  }
  if (args.author === undefined) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'author :',
      default: ''
    });
  }
  return prompt(questions).then((answers) => {
    args.name = args.name !== undefined ? args.name : answers.name;
    args.description = args.description !== undefined ? args.description : answers.description;
    args.version = args.version !== undefined ? args.version : answers.version;
    args.author = args.author !== undefined ? args.author : answers.author;

    logger.info();
    logger.info(messages.PROJECT_INFORMATION_COLLECTED);
    logger.info();
  });
}

function executeSchematic(args, options, logger) {
  const collection = CollectionFactory.create(Collection.NESTJS, logger);
  const schematicOptions = Parser.parse(args, options);
  return collection.execute('application', schematicOptions);
}

class Parser {
  static parse(args, options) {
    const schematicOptions = [];
    Object.keys(args).forEach((key) => {
      schematicOptions.push(new SchematicOption(key, args[ key ]));
    });
    Object.keys(options).forEach((key) => {
      schematicOptions.push(new SchematicOption(key, options[ key ] !== undefined));
    });
    return schematicOptions;
  }
}

function selectPackageManager() {
  const prompt = inquirer.createPromptModule();
  const questions = [{
    type: 'list',
    name: 'package-manager',
    message: messages.PACKAGE_MANAGER_QUESTION,
    choices: [ PackageManager.NPM, PackageManager.YARN ]
  }];
  return prompt(questions).then((answers) => answers[ 'package-manager' ]);
}

function installPackages(packageManager, directory, logger) {
  if (packageManager !== undefined && packageManager !== null && packageManager !== '') {
    return PackageManagerFactory.create(packageManager, logger).install(directory);
  } else {
    logger.info(chalk.green(messages.DRY_RUN_MODE));
  }
}
