const https = require('https');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SUPPORTED_PROVIDERS = {
  'openai': {
    name: 'OpenAI (GPT-4, GPT-3.5)',
    endpoint: 'api.openai.com',
    path: '/v1/chat/completions',
    models: ['gpt-4', 'gpt-3.5-turbo']
  },
  'anthropic': {
    name: 'Anthropic (Claude)',
    endpoint: 'api.anthropic.com',
    path: '/v1/messages',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229']
  },
  'gemini': {
    name: 'Google Gemini',
    endpoint: 'generativelanguage.googleapis.com',
    path: '/v1/models',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro']
  },
  'groq': {
    name: 'Groq (Fast Inference)',
    endpoint: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768']
  },
  'openrouter': {
    name: 'OpenRouter (Multiple Models)',
    endpoint: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    models: ['openai/gpt-4', 'anthropic/claude-3-opus']
  }
};

function getSupportedProviders() {
  return SUPPORTED_PROVIDERS;
}

function generateCommandPrompt(userInput) {
  const platform = process.platform;
  const shell = platform === 'win32' ? 'Windows Command Prompt/PowerShell' : 'Unix Shell (bash/zsh)';
  
  return `You are a shell command expert. Generate a single, executable shell command for ${shell} based on the user's request.

User request: "${userInput}"

Rules:
1. Return ONLY the command, no explanations or markdown
2. Make it safe and commonly used
3. Use standard tools available on ${platform}
4. If multiple commands needed, chain them with && or ;
5. Do not include any backticks, quotes around the entire command, or extra text

Command:`;
}

async function callOpenAI(apiKey, prompt, model = 'gpt-3.5-turbo') {
  try {
    const client = new OpenAI({
      apiKey: apiKey
    });

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a shell command generator. Return only the command, nothing else.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const command = response.choices[0].message.content.trim();
    return command;
  } catch (error) {
    throw new Error(error.message || 'OpenAI API error');
  }
}

async function callGemini(apiKey, prompt, model = 'gemini-2.0-flash') {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model });

    const fullPrompt = `You are a shell command generator. Return only the command, nothing else.

User request: ${prompt}

Command:`;

    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    const command = response.text().trim();
    
    return command;
  } catch (error) {
    throw new Error(error.message || 'Gemini API error');
  }
}

async function callAnthropic(apiKey, prompt, model = 'claude-3-5-sonnet-20241022') {
  const data = JSON.stringify({
    model: model,
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (response.error) {
            reject(new Error(response.error.message || 'Anthropic API error'));
            return;
          }
          
          const command = response.content[0].text.trim();
          resolve(command);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function callGroq(apiKey, prompt, model = 'llama-3.1-70b-versatile') {
  const data = JSON.stringify({
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are a shell command generator. Return only the command, nothing else.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 150
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (response.error) {
            reject(new Error(response.error.message || 'Groq API error'));
            return;
          }
          
          const command = response.choices[0].message.content.trim();
          resolve(command);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function callOpenRouter(apiKey, prompt, model = 'openai/gpt-3.5-turbo') {
  const data = JSON.stringify({
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are a shell command generator. Return only the command, nothing else.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 150
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (response.error) {
            reject(new Error(response.error.message || 'OpenRouter API error'));
            return;
          }
          
          const command = response.choices[0].message.content.trim();
          resolve(command);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function generateCommand(providerName, apiKey, userInput, model = null) {
  const prompt = generateCommandPrompt(userInput);
  
  switch (providerName.toLowerCase()) {
    case 'openai':
      return await callOpenAI(apiKey, prompt, model || 'gpt-3.5-turbo');
    case 'anthropic':
      return await callAnthropic(apiKey, prompt, model || 'claude-3-5-sonnet-20241022');
    case 'gemini':
      return await callGemini(apiKey, prompt, model || 'gemini-2.0-flash');
    case 'groq':
      return await callGroq(apiKey, prompt, model || 'llama-3.1-70b-versatile');
    case 'openrouter':
      return await callOpenRouter(apiKey, prompt, model || 'openai/gpt-3.5-turbo');
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}

module.exports = {
  getSupportedProviders,
  generateCommand
};
