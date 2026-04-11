'use strict';

var createClient = require('@supabase/supabase-js').createClient;
var computeCierreFromMovements = require('./_lib/cierreHelpers').computeCierreFromMovements;

function parseMes(event) {
  var d = new Date();
  var mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  try {
    var q = event.queryStringParameters || {};
    if (q.mes) mes = String(q.mes).slice(0, 7);
    if (event.body) {
      var b = JSON.parse(event.body);
      if (b.mes) mes = String(b.mes).slice(0, 7);
    }
  } catch (e) {}
  return mes;
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
  var mes = parseMes(event);
  var sb = createClient(url, key);
  var r = await sb.from('limaje_kv').select('value').eq('key', 'movements').maybeSingle();
  if (r.error) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: r.error.message }) };
  }
  var movements = (r.data && r.data.value) || [];
  if (!Array.isArray(movements)) movements = [];
  var cierre = computeCierreFromMovements(movements, mes, 'mes');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ok: true, cierre: cierre, persistido: false }),
  };
};
