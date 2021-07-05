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
const PROMPT_PREFIX = "Ikalas >> ";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: PROMPT_PREFIX,
});

readline.emitKeypressEvents(process.stdin, rl);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

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

rl.prompt(true);

Array.prototype.unique = function () {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
};

const historyCommands = shellHistory();

let suggestedCommands = historyCommands.map((element) => ({ name: element }));

let previewSuggestedCommands = [];

const showHoveredCommand = (cmd) => {
  log(chalk.red(cmd.name) + " " + chalk.italic(cmd.summary ? cmd.summary : ""));
};

const showCommand = (cmd) => {
  log(
    chalk.blueBright(cmd.name) +
      " " +
      chalk.italic(cmd.summary ? cmd.summary : "")
  );
};

const previewSuggestions = (position = 0) => {
  console.clear();
  rl.prompt(true);
  log("\n");
  if (!command) {
    suggestedCommands
      .slice(0, MAX_SUGGESTIONS)
      .forEach(function (suggestedCommand, index) {
        if (position === index) {
          return showHoveredCommand(suggestedCommand);
        }
        showCommand(suggestedCommand);
      });
    readline.cursorTo(process.stdin, rl.getPrompt().length, 0);
    return;
  }
  previewSuggestedCommands.forEach(function (suggestedCommand, index) {
    if (position === index) {
      return showHoveredCommand(suggestedCommand);
    }
    showCommand(suggestedCommand);
  });

  readline.cursorTo(process.stdin, rl.getPrompt().length + command.length, 0);
};

var command = "";
let position = 0;

const executeCommand = (status, output, error) => {
  console.clear();
  rl.prompt(true);
  rl.write(command);
  log("\n");
  if (error) {
    log(chalk.red(error));
  }
  if (status === 0) {
    // log(chalk.bgGray.greenBright(output));
    log(output);
  }
  readline.cursorTo(process.stdin, rl.getPrompt().length + command.length, 0);
};

const handleKeyPress = (_str, key) => {
  if (key.ctrl && key.name === "c") {
    return process.exit();
  }

  if (key.name === "return") {
    shelljs.exec(
      command,
      {
        stdio: "inherit",
      },
      executeCommand
    );
    return;
  }

  if (key.name === "backspace") {
    position = 0;
    command = command.substring(0, command.length - 1);
    previewSuggestions(0);
    return;
  }

  if (!["up", "down", "backspace", "right", "left"].includes(key.name)) {
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
};

process.stdin.on("keypress", handleKeyPress);
