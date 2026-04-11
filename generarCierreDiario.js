'use strict';

var createClient = require('@supabase/supabase-js').createClient;
var computeCierreFromMovements = require('./_lib/cierreHelpers').computeCierreFromMovements;

function parseFecha(event) {
  var fecha = new Date().toISOString().slice(0, 10);
  try {
    var q = event.queryStringParameters || {};
    if (q.fecha) fecha = String(q.fecha).slice(0, 10);
    if (event.body) {
      var b = JSON.parse(event.body);
      if (b.fecha) fecha = String(b.fecha).slice(0, 10);
    }
  } catch (e) {}
  return fecha;
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
      body: JSON.stringify({
        ok: false,
        error: 'Defina SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el panel de Netlify (o .env local).',
      }),
    };
  }
  var fecha = parseFecha(event);
  var sb = createClient(url, key);
  var r = await sb.from('limaje_kv').select('value').eq('key', 'movements').maybeSingle();
  if (r.error) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: r.error.message }) };
  }
  var movements = (r.data && r.data.value) || [];
  if (!Array.isArray(movements)) movements = [];
  var cierre = computeCierreFromMovements(movements, fecha, 'dia');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ok: true, cierre: cierre, persistido: false, nota: 'Solo lectura; la app guarda cierres en limaje_kv (cajaCierres) desde el navegador.' }),
  };
};
