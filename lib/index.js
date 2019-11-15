#!/usr/bin/env node

const chalk = require("chalk");
const inquirer = require("inquirer");
const program = require("commander");
const run = require("./run");
const prompt = inquirer.createPromptModule();
const {
  packageName,
  packageVersion,
  commandIsExist,
  listAllCfg,
  saveCfg,
  deleteCfg,
  showConfirm,
} = require("./utils");

const allConfig = listAllCfg();

program
  .version(packageVersion)
  .usage("<command> [options]")
  .option("-l --list", "List all available command.")
  .option(
    "-c --command <command-name>",
    `Use command, Run ${chalk.cyan(
      `${packageName} --list`
    )} to list all command.`
  );

program
  .command("config [option]")
  .usage("[option]")
  .description("Add or delete your local command config.")
  .option("add", "Add command config.")
  .option("-d --delete <alias>", "Delete command config by alias.")
  .action(function(name, cmd) {
    if (name === "add") {
      showAddConfigPrompt();
      return;
    }
    if (cmd.delete) {
      deleteCfg(cmd.delete);
      return
    }
    this.outputHelp();
  })

program.parse(process.argv);

// add some useful info on help
program.on("--help", () => {
  console.log();
  console.log(
    `Run ${chalk.cyan(
      `${packageName} <command> --help`
    )} for detailed usage of given command.`
  );
  console.log();
});
program.commands.forEach(c => c.on("--help", () => console.log()));

// print help when nothing input
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// List all commands
if (program.list) {
  for (let key in allConfig) {
    const desc = allConfig[key].desc || chalk.gray("no description");
    console.log(chalk.cyan(`${key}:`), desc);
  }
}

// execute command
if (program.command && typeof program.command === "string") {
  const name = program.command;
  if (name in allConfig) {
    const { command, confirm } = allConfig[name];
    if (confirm) {
      showConfirm().then(
        () => {
          main(command);
        },
        () => {}
      );
      return;
    }
    main(command);
  } else {
    console.log();
    console.log(
      `Command not found, Run ${chalk.cyan(
        `${packageName} --list`
      )} to list all command.`
    );
    console.log();
  }
}

function showAddConfigPrompt() {
  prompt([
    {
      name: "alias",
      type: "input",
      message: "alias",
      validate(input) {
        const reg = /^[A-Za-z0-9_-\u4e00-\u9fa5]+$/; 
        if (!reg.test(input)) {
          return "alias is not valid.";
        }
        if (input in allConfig) {
          return "alias is existed.";
        }
        return true;
      }
    },
    {
      name: "command",
      type: "input",
      message: "command",
      validate(input) {
        
        if (!input) {
          return "command is required.";
        }
        return true;
      }
    },
    {
      name: "desc",
      type: "input",
      message: "usage description"
    }
  ]).then(answers => {
    if (answers.alias && answers.command) {
      saveCfg(answers);
    }
  });
}


function main(command) {
  const commandName = command.split(' ')[0];
  commandIsExist(commandName)
    .then(() => {
      return run(command);
    })
    .then((stdout) => {
      if (stdout !== '') {
        console.log();
        console.log(stdout);
        console.log();
      } else {
        console.log(chalk.green("success!"));
      }
    })
    .catch(e => {
      console.log(chalk.red(e));
    });
}
