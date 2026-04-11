/**
 * Lógica compartida para funciones serverless (Netlify / adaptar a Cloudflare).
 * Lee movimientos como array en memoria (mismo formato que limaje_kv.key = movements).
 */

function monto(m) {
  var t = Number(m && m.total);
  return isFinite(t) ? Math.abs(t) : 0;
}

function sumIngresos(movs) {
  return (movs || []).reduce(function (s, m) {
    if (!m) return s;
    if (m.type === 'venta' && String(m.pago || '').toLowerCase() !== 'credito') return s + monto(m);
    if (m.type === 'ingreso' || m.type === 'abono') return s + monto(m);
    return s;
  }, 0);
}

function sumEgresos(movs) {
  return (movs || []).reduce(function (s, m) {
    if (m && m.type === 'egreso') return s + monto(m);
    return s;
  }, 0);
}

function filterDay(movs, fecha) {
  var d = String(fecha || '').slice(0, 10);
  return (movs || []).filter(function (m) {
    return String((m && m.date) || '').slice(0, 10) === d;
  });
}

function filterMonth(movs, mesKey) {
  var mk = String(mesKey || '').slice(0, 7);
  return (movs || []).filter(function (m) {
    var md = String((m && m.date) || '');
    return md.length >= 7 && md.slice(0, 7) === mk;
  });
}

function filterYear(movs, y) {
  var yy = String(y || '').slice(0, 4);
  return (movs || []).filter(function (m) {
    var md = String((m && m.date) || '');
    return md.length >= 4 && md.slice(0, 4) === yy;
  });
}

/**
 * @param {Array} movements
 * @param {string} periodoClave día YYYY-MM-DD, mes YYYY-MM o año YYYY
 * @param {'dia'|'mes'|'anio'} granularidad
 */
function computeCierreFromMovements(movements, periodoClave, granularidad) {
  var movs;
  var clave = String(periodoClave || '').trim();
  if (granularidad === 'dia') {
    movs = filterDay(movements, clave);
  } else if (granularidad === 'mes') {
    movs = filterMonth(movements, clave);
  } else {
    movs = filterYear(movements, clave);
  }
  var ing = sumIngresos(movs);
  var egr = sumEgresos(movs);
  return {
    granularidad: granularidad,
    periodo_key: clave,
    totales: {
      ingresos: ing,
      egresos: egr,
      saldo: ing - egr,
    },
    movimientos_count: movs.length,
    movimientos_muestra: movs.slice(0, 500),
  };
}

module.exports = {
  computeCierreFromMovements: computeCierreFromMovements,
  sumIngresos: sumIngresos,
  sumEgresos: sumEgresos,
};
