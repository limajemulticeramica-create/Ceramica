'use strict';
/**
 * Copia la lógica a 4 archivos en la RAÍZ del proyecto (sin carpetas database/utils/…).
 * Así Cloudflare y GitHub Pages no fallan aunque falten subcarpetas en el despliegue.
 */
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var pairs = [
  [path.join(root, 'database', 'supabaseClient.js'), path.join(root, 'limaje-p1.js')],
  [path.join(root, 'utils', 'calculos.js'), path.join(root, 'limaje-p2.js')],
  [path.join(root, 'services', 'reportes.js'), path.join(root, 'limaje-p3.js')],
  [path.join(root, 'scripts', 'limaje-app-core.js'), path.join(root, 'limaje-p4.js')],
];

var banner = '/* LIMAJE — generado por npm run bundle; no editar a mano */\n';

for (var i = 0; i < pairs.length; i++) {
  var src = pairs[i][0];
  var dst = pairs[i][1];
  if (!fs.existsSync(src)) {
    console.error('Falta el archivo:', src);
    process.exit(1);
  }
  fs.writeFileSync(dst, banner + fs.readFileSync(src, 'utf8'), 'utf8');
  console.log('OK →', path.basename(dst), '(' + Math.round(fs.statSync(dst).size / 1024) + ' KB)');
}

var oldBundle = path.join(root, 'limaje-app.js');
if (fs.existsSync(oldBundle)) {
  try {
    fs.unlinkSync(oldBundle);
    console.log('Eliminado limaje-app.js (reemplazado por limaje-p1.js … limaje-p4.js en la raíz).');
  } catch (e) {
    console.warn('No se pudo borrar limaje-app.js:', e.message);
  }
}
