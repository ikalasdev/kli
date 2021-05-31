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

if (process.env.ENABLE_IKALAS == "yes") {
  axios.get(`${API_URL}/api/v1/functions`).then((result) => {
    if (result != null && result.data != null) {
      result.data.forEach(function (fn) {
        suggestedCommands.push({
          name: fn.nameFunction,
          summary: fn.summaryFunction,
        });
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
historyCommands.forEach(function (historyCommand) {
  var found = suggestedCommands.find(function (element) {
    return element.name == historyCommand;
  });
  if (!found) {
    suggestedCommands.push({ name: historyCommand });
  }
});
var command = "";

process.stdin.setRawMode(true);
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

    var previewSuggestedCommands = [];
    suggestedCommands.forEach(function (suggestedCommand) {
      if (suggestedCommand.name.indexOf(command) >= 0) {
        previewSuggestedCommands.push(suggestedCommand);
      }
    });

    previewSuggestedCommands = previewSuggestedCommands.slice(0, 10);
    previewSuggestedCommands.forEach(function (suggestedCommand) {
      log(
        chalk.blue(suggestedCommand.name) +
          " " +
          chalk.italic(suggestedCommand.summary ? suggestedCommand.summary : "")
      );
    });
  }
});
