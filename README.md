# CmdVault

[![npm version](https://badge.fury.io/js/cmdvault.svg)](https://www.npmjs.com/package/cmdvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A smart terminal assistant that remembers, stores, and executes your shell commands.**

Stop typing the same long commands over and over. CmdVault lets you save any command with a short, memorable key and execute it instantly. Plus, generate commands from natural language using AI!

## Features

- 🚀 Execute commands directly through CmdVault
- 💾 Store frequently used commands with memorable keys
- 🔄 Retrieve and execute stored commands instantly
- 🤖 **AI-powered command generation** from natural language
- 📝 Edit stored commands with your preferred editor
- 📋 List all saved commands in a beautiful table
- 🎨 Colored output for better readability
- 🔒 Confirmation prompts for destructive operations
- 🌍 Cross-platform support (Windows, Mac, Linux)
- ⚡ Live command output streaming
- 🔌 Multiple AI provider support (OpenAI, Anthropic, Google Gemini, Groq, OpenRouter)

## Installation

Install CmdVault globally using npm:

```bash
npm install -g cmdvault
```

That's it! You can now use the `cm` command anywhere in your terminal.

## Quick Start

Get started in 30 seconds:

```bash
# 1. Save your first command
cm s hello echo "Hello from CmdVault!"

# 2. Run it using the key
cm hello

# 3. View all saved commands
cm list
```

## Usage

### 1. Execute a Command Directly

Run any shell command through CmdVault:

```bash
cm git status
cm npm test
cm ls -la
```

### 2. Save a Command

Store a command with a memorable key:

```bash
cm s <key> <command>
```

**Examples:**

```bash
cm s gs git status
cm s gp git pull origin main
cm s dev npm run dev
cm s build npm run build && npm run test
```

The command will execute immediately and be saved for future use.

### 3. Retrieve and Execute a Stored Command

Simply use the key to execute the stored command:

```bash
cm gs
# Executes: git status

cm gp
# Executes: git pull origin main
```

### 4. Expand Command Without Executing

Get the stored command printed to terminal without executing it:

```bash
cm c gs
# Outputs: git status
# Does NOT execute - you can copy/paste or edit it
```

This is useful when you want to:
- See what a command does before running it
- Edit the command before execution
- Copy the command for use elsewhere

**Pro Tip:** You can use command substitution to insert it into your terminal:

```bash
# Copy output and paste manually
cm c gs

# Or use in a script
COMMAND=$(cm c gs)
echo "About to run: $COMMAND"
eval $COMMAND
```

### 5. AI Command Generation 🤖

Generate shell commands from natural language using AI:

```bash
cm -g "list all pdf files in current directory"
# AI generates: find . -maxdepth 1 -name "*.pdf"
# Execute this command? (y/n):
```

**First time setup:**
```bash
cm config
# Select AI provider (OpenAI, Anthropic, Gemini, Groq, OpenRouter)
# Enter your API key
# Start generating commands!
```

**More examples:**
```bash
cm -g "show git commits from last week"
cm -g "find process using port 3000"
cm -g "compress all log files"
```

### 6. List All Saved Commands

View all your stored commands in a formatted table:

```bash
cm list
```

Output:
```
┌───────────────┬─────────────────────────────────────────────────────────────────┐
│ Key           │ Command                                                         │
├───────────────┼─────────────────────────────────────────────────────────────────┤
│ dev           │ npm run dev                                                     │
├───────────────┼─────────────────────────────────────────────────────────────────┤
│ gp            │ git pull origin main                                            │
├───────────────┼─────────────────────────────────────────────────────────────────┤
│ gs            │ git status                                                      │
└───────────────┴─────────────────────────────────────────────────────────────────┘

Total: 3 command(s)
```

### 5. Edit a Stored Command

Modify a stored command using your system editor:

```bash
cm e <key>
```

**Example:**

```bash
cm e gp
```

This opens your default editor (nano, vim, or notepad) to edit the command.

**Set your preferred editor:**

```bash
export EDITOR=vim    # Linux/Mac
set EDITOR=code      # Windows
```

### 8. Delete a Stored Command

Remove a stored command:

```bash
cm d <key>
```

**Example:**

```bash
cm d gs
# Prompts for confirmation before deleting
```

## Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `cm <command>` | Execute a command directly | `cm git status` |
| `cm s <key> <command>` | Save/store a command | `cm s gs git status` |
| `cm <key>` | Execute a stored command | `cm gs` |
| `cm c <key>` | Copy/expand command (no execution) | `cm c gs` |
| `cm -g "<prompt>"` | Generate command using AI | `cm -g "list files"` |
| `cm config` | Configure AI providers | `cm config` |
| `cm list` | List all stored commands | `cm list` |
| `cm e <key>` | Edit a stored command | `cm e gs` |
| `cm d <key>` | Delete a stored command | `cm d gs` |
| `cm --help` | Show help information | `cm --help` |
| `cm --version` | Show version | `cm --version` |

## Examples

### Git Workflow

```bash
# Store common git commands
cm s gs git status
cm s ga git add .
cm s gc git commit -m
cm s gp git push origin main
cm s gl git log --oneline -10

# Use them
cm gs
cm ga
cm gc "feat: add new feature"
cm gp
```

### Development Workflow

```bash
# Store project commands
cm s dev npm run dev
cm s build npm run build
cm s test npm test
cm s lint npm run lint
cm s deploy npm run build && npm run deploy

# Quick execution
cm dev
cm test
cm build
```

### System Administration

```bash
# Store system commands
cm s ports lsof -i -P -n | grep LISTEN
cm s mem free -h
cm s disk df -h
cm s procs ps aux | grep node

# Execute instantly
cm ports
cm mem
```

## Features in Detail

### Overwrite Protection

When storing a command with an existing key, CmdVault asks for confirmation:

```bash
cm s gs git status
# Key "gs" already exists. Overwrite? (y/n):
```

### ✅ Failed Command Handling

If a command fails during recording, CmdVault asks if you still want to save it:

```bash
cm s test npm test
# Command failed: Command exited with code 1
# Save command anyway? (y/n):
```

### ✅ Live Output Streaming

Commands stream their output in real-time, not buffered:

```bash
cm dev
# Output appears immediately as the command runs
```

### ✅ Execution Confirmation

After executing a stored command, CmdVault shows what was executed:

```bash
cm gp
[CM] Executing stored command: git pull origin main
# ... command output ...
[CM] Executed: git pull origin main
```

## How It Works

CmdVault stores your commands in a simple JSON file on your system:

- **Linux/Mac:** `~/.cmvault/commands.json`
- **Windows:** `C:\Users\<username>\.cmvault\commands.json`

Your commands are stored locally and never sent anywhere (except when using the AI generation feature, which sends only your prompt to the selected AI provider).

## Requirements

- Node.js >= 14.0.0
- npm (comes with Node.js)

## Troubleshooting

### Command not found: cm

After installation, if `cm` is not recognized:

1. **Restart your terminal** - This ensures the PATH is updated
2. **Check npm global installation path:**
   ```bash
   npm config get prefix
   ```
   Make sure this directory is in your system PATH

3. **Reinstall the package:**
   ```bash
   npm uninstall -g cmdvault
   npm install -g cmdvault
   ```

### Editor not opening

Set your preferred editor:

```bash
# Linux/Mac
export EDITOR=nano
# or
export EDITOR=vim

# Windows
set EDITOR=notepad
```

## FAQ

### Is my data safe?

Yes! All your commands are stored locally on your machine in `~/.cmvault/commands.json`. Nothing is sent to external servers unless you use the AI generation feature, which only sends your natural language prompt to your chosen AI provider.

### Can I use this on multiple machines?

Yes! You can install CmdVault on as many machines as you like. If you want to sync commands between machines, you can manually copy the `~/.cmvault/commands.json` file or use a cloud sync service like Dropbox/Google Drive.

### Do I need an API key to use CmdVault?

No! The core functionality (saving, listing, and executing commands) works without any API key. You only need an API key if you want to use the AI command generation feature (`cm -g`).

### What AI providers are supported?

CmdVault supports:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google Gemini
- Groq
- OpenRouter

Configure your preferred provider with `cm config`.

### Can I export my commands?

Yes! Your commands are stored in a simple JSON file at `~/.cmvault/commands.json`. You can copy, backup, or edit this file directly.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request on [GitHub](https://github.com/vaddisiva5034/cmdvault).

## Support

- **Issues & Bug Reports:** [GitHub Issues](https://github.com/vaddisiva5034/cmdvault/issues)
- **npm Package:** [npmjs.com/package/cmdvault](https://www.npmjs.com/package/cmdvault)

---

Made with ❤️ for developers who love their terminal
