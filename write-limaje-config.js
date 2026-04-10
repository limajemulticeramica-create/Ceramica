/**
 * Genera limaje-config.js en CI (Cloudflare Pages / Netlify / GitHub Actions).
 * Variables: LIMAJE_SUPABASE_URL, LIMAJE_SUPABASE_ANON_KEY
 *
 * En local: si ya existe limaje-config.js, no hace nada.
 * Si no hay env y no existe archivo, copia limaje-config.example.js (la app pedirá configurar Supabase).
 */
'use strict';

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var target = path.join(root, 'limaje-config.js');
var example = path.join(root, 'limaje-config.example.js');

var url = process.env.LIMAJE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
var key = process.env.LIMAJE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (url && key) {
  var body =
    '/* Generado en despliegue — no commitear */\n' +
    'window.LIMAJE_SUPABASE_URL = ' +
    JSON.stringify(String(url).trim()) +
    ';\n' +
    'window.LIMAJE_SUPABASE_ANON_KEY = ' +
    JSON.stringify(String(key).trim()) +
    ';\n';
  fs.writeFileSync(target, body, 'utf8');
  console.log('limaje-config.js escrito desde variables de entorno.');
  process.exit(0);
}

if (fs.existsSync(target)) {
  console.log('limaje-config.js ya existe (desarrollo local); no se sobrescribe.');
  process.exit(0);
}

if (fs.existsSync(example)) {
  fs.copyFileSync(example, target);
  console.warn(
    'AVISO: se copió limaje-config.example.js → limaje-config.js. Defina LIMAJE_SUPABASE_URL y LIMAJE_SUPABASE_ANON_KEY en Cloudflare Pages → Settings → Environment variables y use Build command: npm run build'
  );
  process.exit(0);
}

console.error('No se encontró limaje-config.example.js');
process.exit(1);
