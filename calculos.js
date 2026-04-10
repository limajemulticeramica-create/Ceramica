/**
 * Utilidades puras de caja — sin DOM ni Supabase.
 * Convención de movimientos LIMAJE: type 'venta'|'egreso'|'ingreso'|'abono', total numérico, pago (venta/abono).
 */
(function (global) {
  'use strict';

  function montoMov(m) {
    var t = Number(m && m.total);
    return isFinite(t) ? Math.abs(t) : 0;
  }

  /**
   * Suma ingresos de caja: ventas no crédito + otros ingresos + abonos.
   * @param {Array<Object>} movimientos
   * @returns {number}
   */
  function sumarIngresos(movimientos) {
    var arr = movimientos || [];
    return arr.reduce(function (s, m) {
      if (!m) return s;
      var tipo = m.type;
      if (tipo === 'venta') {
        var p = String(m.pago || '').toLowerCase();
        if (p === 'credito') return s;
        return s + montoMov(m);
      }
      if (tipo === 'ingreso' || tipo === 'abono') return s + montoMov(m);
      return s;
    }, 0);
  }

  /**
   * Suma egresos registrados como type 'egreso'.
   */
  function sumarEgresos(movimientos) {
    var arr = movimientos || [];
    return arr.reduce(function (s, m) {
      if (m && m.type === 'egreso') return s + montoMov(m);
      return s;
    }, 0);
  }

  function calcularSaldo(ingresos, egresos) {
    return (Number(ingresos) || 0) - (Number(egresos) || 0);
  }

  global.sumarIngresos = sumarIngresos;
  global.sumarEgresos = sumarEgresos;
  global.calcularSaldo = calcularSaldo;
})(typeof window !== 'undefined' ? window : globalThis);
