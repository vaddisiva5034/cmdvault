const { program } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const storage = require('./lib/storage');
const { executeCommand, printExecutionMessage } = require('./lib/executor');
const { openEditor } = require('./lib/editor');
const aiConfig = require('./lib/ai-config');
const { getSupportedProviders, generateCommand } = require('./lib/ai-providers');
const readline = require('readline');

program
  .name('cm')
  .description('CmdVault - A smart terminal assistant')
  .version('1.0.0');

program
  .command('s <key> <command...>')
  .description('Save a command with a key')
  .allowUnknownOption()
  .action(async (key, commandParts) => {
    if (key.length < 2) {
      console.error(chalk.red('✗ Key must be at least 2 characters long.'));
      process.exit(1);
    }
    
    const command = commandParts.join(' ');
    
    if (storage.commandExists(key)) {
      const answer = await askConfirmation(
        chalk.yellow(`Key "${key}" already exists. Overwrite? (y/n): `)
      );
      
      if (!answer) {
        console.log(chalk.red('Operation cancelled.'));
        process.exit(0);
      }
    }
    
    try {
      await executeCommand(command);
      storage.setCommand(key, command);
      console.log(chalk.green(`\n✓ Command saved under key "${key}"`));
    } catch (error) {
      console.error(chalk.red(`\n✗ Command failed: ${error.message}`));
      
      const answer = await askConfirmation(
        chalk.yellow(`Save command anyway? (y/n): `)
      );
      
      if (answer) {
        storage.setCommand(key, command);
        console.log(chalk.green(`✓ Command saved under key "${key}"`));
      }
      process.exit(1);
    }
  });

program
  .command('c <key>')
  .description('Copy/expand a stored command to terminal (does not execute)')
  .action((key) => {
    if (!storage.commandExists(key)) {
      console.error(chalk.red(`✗ Key "${key}" not found.`));
      process.exit(1);
    }
    
    const command = storage.getCommand(key);
    console.log(command);
  });

program
  .command('list')
  .description('List all saved commands')
  .action(() => {
    const commands = storage.getAllCommands();
    const keys = Object.keys(commands);
    
    if (keys.length === 0) {
      console.log(chalk.yellow('No commands saved yet.'));
      return;
    }
    
    const table = new Table({
      head: [chalk.cyan('Key'), chalk.cyan('Command')],
      colWidths: [15, 65],
      wordWrap: true
    });
    
    keys.sort().forEach(key => {
      table.push([chalk.green(key), commands[key]]);
    });
    
    console.log(table.toString());
    console.log(chalk.gray(`\nTotal: ${keys.length} command(s)`));
  });

program
  .command('d <key>')
  .description('Delete a saved command')
  .action(async (key) => {
    if (!storage.commandExists(key)) {
      console.error(chalk.red(`✗ Key "${key}" not found.`));
      process.exit(1);
    }
    
    const command = storage.getCommand(key);
    console.log(chalk.yellow(`Command: ${command}`));
    
    const answer = await askConfirmation(
      chalk.yellow(`Delete key "${key}"? (y/n): `)
    );
    
    if (answer) {
      storage.deleteCommand(key);
      console.log(chalk.green(`✓ Key "${key}" deleted.`));
    } else {
      console.log(chalk.red('Operation cancelled.'));
    }
  });

program
  .command('config')
  .description('Configure AI providers for command generation')
  .action(async () => {
    console.log(chalk.cyan.bold('\n🤖 CmdVault AI Configuration\n'));
    
    const providers = aiConfig.getAllProviders();
    const defaultProvider = aiConfig.getDefaultProvider();
    
    if (providers.length > 0) {
      console.log(chalk.green('Current providers:'));
      providers.forEach(p => {
        const isDefault = defaultProvider && p.name === defaultProvider.name;
        const marker = isDefault ? chalk.yellow(' (default)') : '';
        console.log(`  • ${chalk.cyan(p.name)}${marker}`);
      });
      console.log('');
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const supportedProviders = getSupportedProviders();
    
    console.log(chalk.cyan('Available AI Providers:'));
    const providerKeys = Object.keys(supportedProviders);
    providerKeys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${supportedProviders[key].name}`);
    });
    console.log(`  ${providerKeys.length + 1}. Remove a provider`);
    console.log(`  ${providerKeys.length + 2}. Set default provider`);
    console.log(`  ${providerKeys.length + 3}. Exit\n`);
    
    rl.question(chalk.yellow('Select an option: '), async (choice) => {
      const choiceNum = parseInt(choice);
      
      if (choiceNum === providerKeys.length + 3 || isNaN(choiceNum)) {
        rl.close();
        return;
      }
      
      if (choiceNum === providerKeys.length + 1) {
        if (providers.length === 0) {
          console.log(chalk.red('No providers configured.'));
          rl.close();
          return;
        }
        
        console.log(chalk.cyan('\nConfigured providers:'));
        providers.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name}`);
        });
        
        rl.question(chalk.yellow('\nSelect provider to remove: '), (removeChoice) => {
          const removeNum = parseInt(removeChoice);
          if (removeNum > 0 && removeNum <= providers.length) {
            const providerToRemove = providers[removeNum - 1];
            aiConfig.removeProvider(providerToRemove.name);
            console.log(chalk.green(`✓ Provider "${providerToRemove.name}" removed.`));
          } else {
            console.log(chalk.red('Invalid selection.'));
          }
          rl.close();
        });
        return;
      }
      
      if (choiceNum === providerKeys.length + 2) {
        if (providers.length === 0) {
          console.log(chalk.red('No providers configured.'));
          rl.close();
          return;
        }
        
        console.log(chalk.cyan('\nConfigured providers:'));
        providers.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name}`);
        });
        
        rl.question(chalk.yellow('\nSelect default provider: '), (defaultChoice) => {
          const defaultNum = parseInt(defaultChoice);
          if (defaultNum > 0 && defaultNum <= providers.length) {
            const providerToSetDefault = providers[defaultNum - 1];
            aiConfig.setDefaultProvider(providerToSetDefault.name);
            console.log(chalk.green(`✓ Default provider set to "${providerToSetDefault.name}".`));
          } else {
            console.log(chalk.red('Invalid selection.'));
          }
          rl.close();
        });
        return;
      }
      
      if (choiceNum > 0 && choiceNum <= providerKeys.length) {
        const selectedKey = providerKeys[choiceNum - 1];
        const selectedProvider = supportedProviders[selectedKey];
        
        console.log(chalk.cyan(`\nConfiguring: ${selectedProvider.name}`));
        
        rl.question(chalk.yellow('Enter API Key: '), (apiKey) => {
          if (!apiKey || apiKey.trim() === '') {
            console.log(chalk.red('API Key cannot be empty.'));
            rl.close();
            return;
          }
          
          const isFirstProvider = providers.length === 0;
          
          if (isFirstProvider) {
            aiConfig.addProvider(selectedKey, apiKey.trim(), true);
            console.log(chalk.green(`✓ Provider "${selectedKey}" added and set as default.`));
            rl.close();
          } else {
            rl.question(chalk.yellow('Set as default provider? (y/n): '), (setDefault) => {
              const isDefault = setDefault.toLowerCase() === 'y' || setDefault.toLowerCase() === 'yes';
              aiConfig.addProvider(selectedKey, apiKey.trim(), isDefault);
              
              if (isDefault) {
                console.log(chalk.green(`✓ Provider "${selectedKey}" added and set as default.`));
              } else {
                console.log(chalk.green(`✓ Provider "${selectedKey}" added.`));
              }
              rl.close();
            });
          }
        });
      } else {
        console.log(chalk.red('Invalid selection.'));
        rl.close();
      }
    });
  });

program
  .command('e <key>')
  .description('Edit a saved command')
  .action(async (key) => {
    if (!storage.commandExists(key)) {
      console.error(chalk.red(`✗ Key "${key}" not found.`));
      process.exit(1);
    }
    
    const currentCommand = storage.getCommand(key);
    console.log(chalk.cyan(`Current command: ${currentCommand}`));
    console.log(chalk.gray('Opening editor...\n'));
    
    try {
      const editedCommand = openEditor(currentCommand);
      
      if (!editedCommand) {
        console.log(chalk.red('✗ Command cannot be empty. Operation cancelled.'));
        process.exit(1);
      }
      
      if (editedCommand === currentCommand) {
        console.log(chalk.yellow('No changes made.'));
        return;
      }
      
      storage.setCommand(key, editedCommand);
      console.log(chalk.green(`✓ Key "${key}" updated.`));
      console.log(chalk.cyan(`New command: ${editedCommand}`));
    } catch (error) {
      console.error(chalk.red(`✗ Editor error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .argument('[args...]')
  .description('Execute a command or retrieve a stored command')
  .action(async (args) => {
    if (args.length === 0) {
      program.help();
      return;
    }
    
    const firstArg = args[0];
    
    if (storage.commandExists(firstArg) && args.length === 1) {
      const storedCommand = storage.getCommand(firstArg);
      console.log(chalk.cyan(`[CM] Executing stored command: ${storedCommand}\n`));
      
      try {
        await executeCommand(storedCommand);
        printExecutionMessage(storedCommand);
      } catch (error) {
        console.error(chalk.red(`\n✗ Command failed: ${error.message}`));
        process.exit(1);
      }
    } else {
      const command = args.join(' ');
      
      try {
        await executeCommand(command);
      } catch (error) {
        console.error(chalk.red(`✗ Command failed: ${error.message}`));
        process.exit(1);
      }
    }
  });

function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function handleAiGeneration() {
  const args = process.argv.slice(2);
  
  const gIndex = args.findIndex(arg => arg === '-g' || arg === '--generate');
  
  if (gIndex !== -1 && args[gIndex + 1]) {
    const prompt = args[gIndex + 1];
    
    const defaultProvider = aiConfig.getDefaultProvider();
    
    if (!defaultProvider) {
      console.error(chalk.red('✗ No AI provider configured.'));
      console.log(chalk.yellow('Run "cm config" to set up an AI provider.'));
      process.exit(1);
    }
    
    console.log(chalk.cyan(`🤖 Generating command using ${defaultProvider.name}...`));
    console.log(chalk.gray(`Prompt: "${prompt}"\n`));
    
    try {
      const generatedCommand = await generateCommand(
        defaultProvider.name,
        defaultProvider.apiKey,
        prompt
      );
      
      const cleanCommand = generatedCommand
        .replace(/^```[\w]*\n?/g, '')
        .replace(/\n?```$/g, '')
        .replace(/^["']|["']$/g, '')
        .trim();
      
      console.log(chalk.green('✓ Generated command:'));
      console.log(chalk.blackBright.bold(`  ${cleanCommand}\n`));
      
      const answer = await askConfirmation(
        chalk.yellow('Execute this command? (y/n): ')
      );
      
      if (answer) {
        console.log('');
        try {
          await executeCommand(cleanCommand);
          printExecutionMessage(cleanCommand);
        } catch (error) {
          console.error(chalk.red(`\n✗ Command failed: ${error.message}`));
          process.exit(1);
        }
      } else {
        console.log(chalk.gray('Command not executed.'));
        console.log(chalk.gray(`You can copy it: ${cleanCommand}`));
      }
    } catch (error) {
      console.error(chalk.red(`✗ AI generation failed: ${error.message}`));
      console.log(chalk.yellow('\nTips:'));
      console.log('  • Check your API key is valid');
      console.log('  • Ensure you have internet connection');
      console.log('  • Verify your API provider account has credits');
      process.exit(1);
    }
    
    process.exit(0);
  }
}

(async () => {
  await handleAiGeneration();
  
  program.parse(process.argv);
  
  if (process.argv.length === 2) {
    program.help();
  }
})();
