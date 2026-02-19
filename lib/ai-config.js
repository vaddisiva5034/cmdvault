const fs = require('fs');
const path = require('path');
const os = require('os');

const KI_DIR = path.join(os.homedir(), '.cmvault');
const AI_CONFIG_FILE = path.join(KI_DIR, 'ai-config.json');

function ensureKiDirectory() {
  if (!fs.existsSync(KI_DIR)) {
    fs.mkdirSync(KI_DIR, { recursive: true });
  }
}

function ensureAiConfigFile() {
  ensureKiDirectory();
  if (!fs.existsSync(AI_CONFIG_FILE)) {
    const defaultConfig = {
      providers: [],
      defaultProvider: null
    };
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

function loadAiConfig() {
  ensureAiConfigFile();
  try {
    const data = fs.readFileSync(AI_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { providers: [], defaultProvider: null };
  }
}

function saveAiConfig(config) {
  ensureAiConfigFile();
  fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(config, null, 2));
}

function addProvider(name, apiKey, isDefault = false) {
  const config = loadAiConfig();
  
  const existingIndex = config.providers.findIndex(p => p.name === name);
  
  if (existingIndex !== -1) {
    config.providers[existingIndex].apiKey = apiKey;
  } else {
    config.providers.push({ name, apiKey });
  }
  
  if (isDefault || config.providers.length === 1) {
    config.defaultProvider = name;
  }
  
  saveAiConfig(config);
}

function removeProvider(name) {
  const config = loadAiConfig();
  config.providers = config.providers.filter(p => p.name !== name);
  
  if (config.defaultProvider === name) {
    config.defaultProvider = config.providers.length > 0 ? config.providers[0].name : null;
  }
  
  saveAiConfig(config);
}

function setDefaultProvider(name) {
  const config = loadAiConfig();
  const provider = config.providers.find(p => p.name === name);
  
  if (!provider) {
    throw new Error(`Provider "${name}" not found`);
  }
  
  config.defaultProvider = name;
  saveAiConfig(config);
}

function getDefaultProvider() {
  const config = loadAiConfig();
  if (!config.defaultProvider) {
    return null;
  }
  
  return config.providers.find(p => p.name === config.defaultProvider);
}

function getAllProviders() {
  const config = loadAiConfig();
  return config.providers;
}

function getProvider(name) {
  const config = loadAiConfig();
  return config.providers.find(p => p.name === name);
}

module.exports = {
  addProvider,
  removeProvider,
  setDefaultProvider,
  getDefaultProvider,
  getAllProviders,
  getProvider,
  AI_CONFIG_FILE
};
