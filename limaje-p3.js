/* LIMAJE — generado por npm run bundle; no editar a mano */
/**
 * Reportes financieros en JSON — listos para capas de exportación (PDF/Excel) en el futuro.
 * Depende de sumarIngresos/sumarEgresos/calcularSaldo (utils/calculos.js).
 */
(function (global) {
  'use strict';

  function filtrarPorDia(movs, fecha) {
    var d = String(fecha || '').slice(0, 10);
    return (movs || []).filter(function (m) {
      return String((m && m.date) || '').slice(0, 10) === d;
    });
  }

  function filtrarPorMes(movs, mesKey) {
    var mk = String(mesKey || '').slice(0, 7);
    return (movs || []).filter(function (m) {
      var md = String((m && m.date) || '');
      return md.length >= 7 && md.slice(0, 7) === mk;
    });
  }

  function filtrarPorAnio(movs, anio) {
    var y = String(anio || '').slice(0, 4);
    return (movs || []).filter(function (m) {
      var md = String((m && m.date) || '');
      return md.length >= 4 && md.slice(0, 4) === y;
    });
  }

  function totalesVentasPorTipo(movs) {
    var ventas = (movs || []).filter(function (m) {
      return m && m.type === 'venta';
    });
    var porPago = {};
    var total = 0;
    ventas.forEach(function (m) {
      var p = m.pago || '—';
      var t = Number(m.total) || 0;
      porPago[p] = (porPago[p] || 0) + t;
      total += t;
    });
    return { totalVentas: total, porFormaPago: porPago, count: ventas.length };
  }

  /**
   * @param {string} fecha YYYY-MM-DD
   * @param {Array} [movimientos] si se omite y existe getMovements(), se usa
   */
  function generarReporteDiario(fecha, movimientos) {
    var src =
      movimientos != null
        ? movimientos
        : typeof global.getMovements === 'function'
          ? global.getMovements()
          : [];
    var mvs = filtrarPorDia(src, fecha);
    var ing = global.sumarIngresos(mvs);
    var egr = global.sumarEgresos(mvs);
    var tv = totalesVentasPorTipo(mvs);
    return {
      periodo: { tipo: 'dia', clave: String(fecha || '').slice(0, 10) },
      resumen: {
        ingresosCaja: ing,
        egresos: egr,
        saldoNeto: global.calcularSaldo(ing, egr),
        ventasTotales: tv.totalVentas,
        ventasPorFormaPago: tv.porFormaPago,
      },
      movimientos: mvs,
      meta: { count: mvs.length, exportReady: true, exportFormats: ['pdf', 'xlsx'] },
    };
  }

  function generarReporteMensual(mes, movimientos) {
    var mk = String(mes || '').slice(0, 7);
    var src =
      movimientos != null
        ? movimientos
        : typeof global.getMovements === 'function'
          ? global.getMovements()
          : [];
    var mvs = filtrarPorMes(src, mk);
    var ing = global.sumarIngresos(mvs);
    var egr = global.sumarEgresos(mvs);
    var tv = totalesVentasPorTipo(mvs);
    return {
      periodo: { tipo: 'mes', clave: mk },
      resumen: {
        ingresosCaja: ing,
        egresos: egr,
        saldoNeto: global.calcularSaldo(ing, egr),
        ventasTotales: tv.totalVentas,
        ventasPorFormaPago: tv.porFormaPago,
      },
      movimientos: mvs,
      meta: { count: mvs.length, exportReady: true, exportFormats: ['pdf', 'xlsx'] },
    };
  }

  function generarReporteAnual(anio, movimientos) {
    var y = String(anio || '').slice(0, 4);
    var src =
      movimientos != null
        ? movimientos
        : typeof global.getMovements === 'function'
          ? global.getMovements()
          : [];
    var mvs = filtrarPorAnio(src, y);
    var ing = global.sumarIngresos(mvs);
    var egr = global.sumarEgresos(mvs);
    var tv = totalesVentasPorTipo(mvs);
    return {
      periodo: { tipo: 'anio', clave: y },
      resumen: {
        ingresosCaja: ing,
        egresos: egr,
        saldoNeto: global.calcularSaldo(ing, egr),
        ventasTotales: tv.totalVentas,
        ventasPorFormaPago: tv.porFormaPago,
      },
      movimientos: mvs,
      meta: { count: mvs.length, exportReady: true, exportFormats: ['pdf', 'xlsx'] },
    };
  }

  global.LimajeReportes = {
    generarReporteDiario: generarReporteDiario,
    generarReporteMensual: generarReporteMensual,
    generarReporteAnual: generarReporteAnual,
  };
})(typeof window !== 'undefined' ? window : globalThis);
