'use strict';

var createClient = require('@supabase/supabase-js').createClient;
var computeCierreFromMovements = require('./_lib/cierreHelpers').computeCierreFromMovements;

function parseAnio(event) {
  var anio = String(new Date().getFullYear());
  try {
    var q = event.queryStringParameters || {};
    if (q.anio) anio = String(q.anio).slice(0, 4);
    if (event.body) {
      var b = JSON.parse(event.body);
      if (b.anio != null) anio = String(b.anio).slice(0, 4);
    }
  } catch (e) {}
  return anio;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }
  var url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Faltan variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.' }),
    };
  }
  var anio = parseAnio(event);
  var sb = createClient(url, key);
  var r = await sb.from('limaje_kv').select('value').eq('key', 'movements').maybeSingle();
  if (r.error) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: r.error.message }) };
  }
  var movements = (r.data && r.data.value) || [];
  if (!Array.isArray(movements)) movements = [];
  var cierre = computeCierreFromMovements(movements, anio, 'anio');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ok: true, cierre: cierre, persistido: false }),
  };
};
