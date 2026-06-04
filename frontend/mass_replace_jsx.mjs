import fs from 'fs';
import path from 'path';

const componentsDir = 'e:/Mine/antigravity/content_,machines/frontend/src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

const iconMap = {
  'ShieldCheck': 'ShieldCheck',
  'RefreshCw': 'ArrowsClockwise',
  'AlertTriangle': 'Warning',
  'PenTool': 'PenNib',
  'Send': 'PaperPlaneRight',
  'Play': 'Play',
  'CheckCircle2': 'CheckCircle',
  'MessageSquare': 'ChatTeardropText',
  'AlertCircle': 'WarningCircle',
  'BrainCircuit': 'Brain',
  'ChevronDown': 'CaretDown',
  'ChevronUp': 'CaretUp',
  'Search': 'MagnifyingGlass',
  'Sparkles': 'Lightning',
  'FileDown': 'FileArrowDown',
  'Edit3': 'PencilSimple',
  'FileText': 'FileText',
  'Layers': 'Stack',
  'Clipboard': 'ClipboardText',
  'Check': 'Check',
  'BookOpen': 'BookOpen',
  'RotateCcw': 'ArrowCounterClockwise',
  'Settings': 'Gear',
  'Save': 'FloppyDisk',
  'Plus': 'Plus',
  'Star': 'Star',
  'FolderOpen': 'FolderOpen',
  'X': 'X'
};

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace usage in JSX
  for (const [lucideName, phosphorName] of Object.entries(iconMap)) {
    // Replace <IconName
    content = content.replace(new RegExp(`<${lucideName}(\\s|>)`, 'g'), `<${phosphorName}$1`);
    // Replace </IconName>
    content = content.replace(new RegExp(`</${lucideName}>`, 'g'), `</${phosphorName}>`);
  }
  
  fs.writeFileSync(filePath, content);
}

console.log('JSX replacement complete.');
