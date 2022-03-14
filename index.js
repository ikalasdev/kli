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
const { execSync } = require('child_process');


const log = console.log;

const API_URL = process.env.IKALAS_API_URL;
const MAX_SUGGESTIONS = 10;
const PROMPT_PREFIX = "Ikalas >> ";

let HOVERED_COMMAND = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: PROMPT_PREFIX,
});

readline.emitKeypressEvents(process.stdin, rl);
if (process.stdin.isTTY) process.stdin.setRawMode(true);


axios.defaults.headers.common['apikey'] = process.env.IKALAS_API_KEY //

let ikalas_commands = [];
if (process.env.ENABLE_IKALAS == "yes") {
  axios.get(`${API_URL}/kli/functions`).then((result) => {
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
  log(chalk.green("Name"));
  log("\t kli - A free solution that offers fast and online tools.\n");
  log(chalk.green("Synopsis"));
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

let viewedSuggestions = suggestedCommands.slice(0, MAX_SUGGESTIONS);

const showHoveredCommand = (cmd) => {
  HOVERED_COMMAND = cmd;
  log(chalk.red(cmd.name) + " " + chalk.italic(cmd.summary ? cmd.summary : ""));
};

const showCommand = (cmd) => {
  log(
    chalk.green(cmd.name) +
      " " +
      chalk.italic(cmd.summary ? cmd.summary : "")
  );
};

const showSuggestions = (position = 0) => {
  console.clear();
  rl.prompt(true);
  log("\n");
  viewedSuggestions.forEach(function (suggestedCommand, index) {
    if (position === index) {
      return showHoveredCommand(suggestedCommand);
    }
    showCommand(suggestedCommand);
  });
  // readline.cursorTo(process.stdin, rl.getPrompt().length + command.length, 0);
};

var command = "";
let position = 0;

const executeCommand = async (status, output, error) => {
  console.clear();

  let cmdToExecute = command;
  if(HOVERED_COMMAND!=null){
    cmdToExecute = HOVERED_COMMAND.name;
  }
  let result = await axios.get(`${API_URL}/kli/functions/${cmdToExecute}`)
  
  let fnObject = null;
  if (result != null && result.data != null) {
    fnObject = result.data;
  }
  

  if(fnObject.languageFunction=="bash"){
    execSync(fnObject.bodyFunction, {stdio: 'inherit'});
  }else{
    result = await axios.post(`${API_URL}/kli/execute-function/${cmdToExecute}`)
    if (result != null && result.data != null) {
      console.log(result.data)
    }
  }

  


    // rl.write(fnObject.bodyFunction)
  // rl.prompt(true);
  // rl.write(command);
  // log("\n");
  // if (error) {
  //   log(chalk.red(error));
  // }
  // if (status === 0) {
  //   // log(chalk.bgGray.greenBright(output));
  //   log(output);
  // }
  // readline.cursorTo(process.stdin, rl.getPrompt().length + command.length, 0);
};

const handleKeyPress = (_str, key) => {
  if (key.ctrl && key.name === "c") {
    return process.exit();
  }

  if (key.name === "return") {
    console.clear();
    rl.prompt(true);
    let cmdToExecute;
    if (viewedSuggestions.length === 0) {
      // no suggestions, execute user input command
      cmdToExecute = command;
    }
    if (viewedSuggestions.length >= 1) {
      cmdToExecute = viewedSuggestions[position].name;
    }
    shelljs.exec(
      cmdToExecute,
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
    if (command) {
      viewedSuggestions = suggestedCommands
        .filter((element) => element.name.indexOf(command) >= 0)
        .slice(0, MAX_SUGGESTIONS);
    }
    showSuggestions(0);
    return;
  }

  if (!["up", "down", "backspace", "right", "left"].includes(key.name)) {
    command += key.sequence;

    viewedSuggestions = [];
    viewedSuggestions = suggestedCommands
      .filter((element) => element.name.indexOf(command) >= 0)
      .slice(0, MAX_SUGGESTIONS);

    showSuggestions();
  }

  if (key.name == "down") {
    if (
      position < MAX_SUGGESTIONS - 1 &&
      position < viewedSuggestions.length - 1
    ) {
      position++;
      showSuggestions(position);
    }
    return;
  }

  if (key.name == "up") {
    if (position > 0) {
      position--;
      showSuggestions(position);
    }
    return;
  }
};

process.stdin.on("keypress", handleKeyPress);
