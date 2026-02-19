const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getEditor() {
  return process.env.EDITOR || process.env.VISUAL || getDefaultEditor();
}

function getDefaultEditor() {
  const platform = process.platform;
  
  if (platform === 'win32') {
    return 'notepad';
  } else if (platform === 'darwin') {
    return 'nano';
  } else {
    return 'nano';
  }
}

function openEditor(content) {
  const tmpFile = path.join(os.tmpdir(), `cm-edit-${Date.now()}.txt`);
  
  try {
    fs.writeFileSync(tmpFile, content);
    
    const editor = getEditor();
    const result = spawnSync(editor, [tmpFile], {
      stdio: 'inherit'
    });
    
    if (result.error) {
      throw result.error;
    }
    
    const editedContent = fs.readFileSync(tmpFile, 'utf8').trim();
    
    fs.unlinkSync(tmpFile);
    
    return editedContent;
  } catch (error) {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    throw error;
  }
}

module.exports = {
  openEditor
};
