const { spawn } = require('child_process');
const chalk = require('chalk');

function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellFlag = isWindows ? '/c' : '-c';

    const child = spawn(shell, [shellFlag, command], {
      stdio: 'inherit',
      cwd: options.cwd || process.cwd(),
      env: process.env
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
}

function printExecutionMessage(command) {
  console.log(chalk.cyan(`[CM] Executed: ${command}`));
}

module.exports = {
  executeCommand,
  printExecutionMessage
};
