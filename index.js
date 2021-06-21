const fs = require("fs");
require("dotenv").config({ path: __dirname + "/.env.public" });
const envConfig = require("dotenv").parse(fs.readFileSync(".env"));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}
const readline = require("readline");
const shellHistory = require("shell-history");
const shelljs = require("shelljs");
const axios = require("axios");
const chalk = require("chalk");
const log = console.log;

const API_URL = process.env.IKALAS_API_URL;

let ikalas_commands = [];

if (process.env.ENABLE_IKALAS == "yes") {
  axios.get(`${API_URL}/api/v1/functions`).then((result) => {
    if (result != null && result.data != null) {
      ikalas_commands = result.data.map(function (fn) {
        return {
          name: fn.nameFunction,
          summary: fn.summaryFunction,
        };
      });
    }
  });
}

Array.prototype.unique = function () {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
};

readline.emitKeypressEvents(process.stdin);
console.log("\033[2J");
var suggestedCommands = [];

var historyCommands = shellHistory();
var command = "";

process.stdin.setRawMode(true);

const showHelpMsg = () => {
  log("\nKLI 1.0\t\t\tKli Manual\t\t\tKLI(1)\n");
  log(chalk.blueBright("Name"));
  log("\t kli - A free solution that offers fast and online tools.\n");
  log(chalk.blueBright("Synopsis"));
  log(`\t ${chalk.greenBright("kli [OPTIONS]...")}.\n`);
  log(chalk.blue("Description"));
  log(
    "\t kli is command line version of Ikalas solution, offers free online, simple and efficient tools. Easily, you can convert documents, manipulate videos or record your screen online.\n"
  );
  log(`\t ${chalk.greenBright("-l, --list")}`);
  log("\t\tlist all kli functions.\n");
  log(`\t ${chalk.greenBright("-h, --help")}`);
  log("\t\tshow this manual page.\n");
  log("kli 1.0\t\t\t10/06/2021\t\t\tKLI(1)\n");
};

if (process.argv.length > 2 && ["--help", "-h"].includes(process.argv[2])) {
  showHelpMsg();
}

process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") {
    process.exit();
  } else if (key.name == "return") {
    console.log("\033[2J");
    shelljs.exec(command, function (status, output) {
      // console.log('Exit status:', status);
      // console.log('Program output:', output);
    });
    // process.exit();
    console.log(">>");
    command = "";
  } else {
    if (key.name == "backspace") {
      command = command.substring(0, command.length - 1);
    } else {
      command += key.sequence;
    }

    console.log("\033[2J");
    console.log(">>" + command);
    console.log("");

    suggestedCommands = [
      ...ikalas_commands,
      ...historyCommands.map((element) => ({ name: element })),
    ];

    const previewSuggestedCommands = suggestedCommands
      .filter((element) => element.name.indexOf(command) >= 0)
      .slice(0, 10);

    previewSuggestedCommands.forEach(function (suggestedCommand) {
      log(
        chalk.blueBright(suggestedCommand.name) +
          " " +
          chalk.italic(suggestedCommand.summary ? suggestedCommand.summary : "")
      );
    });
  }
});
