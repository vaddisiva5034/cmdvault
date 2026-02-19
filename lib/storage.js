const fs = require('fs');
const path = require('path');
const os = require('os');

const KI_DIR = path.join(os.homedir(), '.cmvault');
const COMMANDS_FILE = path.join(KI_DIR, 'commands.json');

function ensureKiDirectory() {
  if (!fs.existsSync(KI_DIR)) {
    fs.mkdirSync(KI_DIR, { recursive: true });
  }
}

function ensureCommandsFile() {
  ensureKiDirectory();
  if (!fs.existsSync(COMMANDS_FILE)) {
    fs.writeFileSync(COMMANDS_FILE, JSON.stringify({}, null, 2));
  }
}

function loadCommands() {
  ensureCommandsFile();
  try {
    const data = fs.readFileSync(COMMANDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function saveCommands(commands) {
  ensureCommandsFile();
  fs.writeFileSync(COMMANDS_FILE, JSON.stringify(commands, null, 2));
}

function getCommand(key) {
  const commands = loadCommands();
  return commands[key];
}

function setCommand(key, command) {
  const commands = loadCommands();
  commands[key] = command;
  saveCommands(commands);
}

function deleteCommand(key) {
  const commands = loadCommands();
  if (commands[key]) {
    delete commands[key];
    saveCommands(commands);
    return true;
  }
  return false;
}

function getAllCommands() {
  return loadCommands();
}

function commandExists(key) {
  const commands = loadCommands();
  return key in commands;
}

module.exports = {
  getCommand,
  setCommand,
  deleteCommand,
  getAllCommands,
  commandExists,
  COMMANDS_FILE
};
