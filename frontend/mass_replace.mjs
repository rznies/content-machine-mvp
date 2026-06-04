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

  // Replace Lucide imports
  const lucideRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];/g;
  content = content.replace(lucideRegex, (match, importsStr) => {
    const imports = importsStr.split(',').map(s => s.trim());
    const newImports = imports.map(imp => {
      const parts = imp.split(' as ');
      const name = parts[0];
      const alias = parts[1];
      const mapped = iconMap[name] || name;
      return alias ? `${mapped} as ${alias}` : mapped;
    });
    return `import { ${newImports.join(', ')} } from '@phosphor-icons/react';`;
  });

  // Replace violet classes with primary
  content = content.replace(/violet/g, 'primary');
  
  // Also fix `<IconName ` -> `<IconName weight="bold" ` in some places if needed, but for now just let it be default weight.
  
  fs.writeFileSync(filePath, content);
}

console.log('Mass replacement complete.');
