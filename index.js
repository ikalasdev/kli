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
const MAX_SUGGESTIONS = 10;


axios.defaults.headers.common['apikey'] = process.env.IKALAS_API_KEY //

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

      suggestedCommands.unshift(...ikalas_commands);
    }
  });
}

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
  process.exit();
}

Array.prototype.unique = function () {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
};

readline.emitKeypressEvents(process.stdin);
console.log("\033[2J");

const historyCommands = shellHistory();

let suggestedCommands = historyCommands.map((element) => ({ name: element }));

let previewSuggestedCommands = [];

const previewSuggestions = (position = 0) => {
  console.log("\033[2J");
  console.log(">>" + command);
  console.log("");
  if (!command) {
    suggestedCommands
      .slice(0, MAX_SUGGESTIONS)
      .forEach(function (suggestedCommand, index) {
        if (position === index) {
          return log(
            chalk.red(suggestedCommand.name) +
              " " +
              chalk.italic(
                suggestedCommand.summary ? suggestedCommand.summary : ""
              )
          );
        }
        log(
          chalk.blueBright(suggestedCommand.name) +
            " " +
            chalk.italic(
              suggestedCommand.summary ? suggestedCommand.summary : ""
            )
        );
      });
    return;
  }
  previewSuggestedCommands.forEach(function (suggestedCommand, index) {
    if (position === index) {
      return log(
        chalk.red(suggestedCommand.name) +
          " " +
          chalk.italic(suggestedCommand.summary ? suggestedCommand.summary : "")
      );
    }
    log(
      chalk.blueBright(suggestedCommand.name) +
        " " +
        chalk.italic(suggestedCommand.summary ? suggestedCommand.summary : "")
    );
  });
};

var command = "";
let position = 0;


process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") {
    return process.exit();
  }

  if (key.name === "return") {
    console.log("\033[2J");
    shelljs.exec(command, function (status, output) {
      // console.log('Exit status:', status);
      // console.log('Program output:', output);
    });
    // process.exit();
    console.log(">>");
    command = "";
    return;
  }

  if (key.name === "backspace") {
    command = command.substring(0, command.length - 1);
    previewSuggestions(0);
    return;
  }

  if (!["up", "down", "backspace"].includes(key.name)) {
    command += key.sequence;

    previewSuggestedCommands = [];
    previewSuggestedCommands = suggestedCommands
      .filter((element) => element.name.indexOf(command) >= 0)
      .slice(0, MAX_SUGGESTIONS);

    previewSuggestions();
  }

  if (key.name == "down") {
    if (position < MAX_SUGGESTIONS - 1) {
      position++;
      previewSuggestions(position);
    }
    return;
  }

  if (key.name == "up") {
    if (position > 0) {
      position--;
      previewSuggestions(position);
    }
    return;
  }
});
