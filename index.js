const readline = require("readline");
const shellHistory = require("shell-history");
var shelljs = require("shelljs");

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
    return element == historyCommand;
  });
  if (!found) suggestedCommands.push(historyCommand);
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
      if (suggestedCommand.indexOf(command) >= 0) {
        previewSuggestedCommands.push(suggestedCommand);
      }
    });

    previewSuggestedCommands = previewSuggestedCommands.slice(0, 10);
    previewSuggestedCommands.forEach(function (suggestedCommand) {
      console.log("\x1b[36m%s\x1b[0m", suggestedCommand);
    });
  }
});
