const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, '../lib/games-data.ts'), 'utf8');

const imageMap = {
  'carrom-singles':  'https://images.unsplash.com/photo-1612822747230-de8d05ef91e4?auto=format&fit=crop&w=800&q=80',
  'carrom-doubles':  'https://images.unsplash.com/photo-1612822747230-de8d05ef91e4?auto=format&fit=crop&w=800&q=80',
  'pucket':          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  'thula':           'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=800&q=80',
  'squid-game':      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&q=80',
  'subway-surfers':  'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&q=80',
  'rope-jump':       'https://images.unsplash.com/photo-1598986646512-9330bcc4c0dc?auto=format&fit=crop&w=800&q=80',
  'relay-race':      'https://images.unsplash.com/photo-1521396333185-f4f293f0de6e?auto=format&fit=crop&w=800&q=80',
  'foosball-singles':'https://images.unsplash.com/photo-1529874777078-a7c6f8d4ebdf?auto=format&fit=crop&w=800&q=80',
  'foosball-doubles':'https://images.unsplash.com/photo-1529874777078-a7c6f8d4ebdf?auto=format&fit=crop&w=800&q=80',
};

const lines = content.split('\n');
let currentId = null;

for (let i = 0; i < lines.length; i++) {
  const idMatch = lines[i].match(/^\s+id: '([^']+)'/);
  if (idMatch) currentId = idMatch[1];

  if (lines[i].includes('image:') && currentId && imageMap[currentId]) {
    const indentMatch = lines[i].match(/^(\s+)/);
    const indent = indentMatch ? indentMatch[1] : '    ';
    lines[i] = indent + "image: '" + imageMap[currentId] + "',";
    console.log('Fixed:', currentId);
  }
}

fs.writeFileSync(path.join(__dirname, '../lib/games-data.ts'), lines.join('\n'), 'utf8');
console.log('Done. All images updated.');
