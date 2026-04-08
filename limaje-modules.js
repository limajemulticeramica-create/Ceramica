/**
 * LIMAJE — Módulos 1–7 (Supabase SQL + UI auxiliar)
 * Requiere: window.__limajeSupabase, funciones globales del core (DB, getProducts, …)
 */
(function (global) {
  'use strict';

  global.__limajeSqlCore = global.__limajeSqlCore || {};
  var L = global.__limajeSqlCore;

  L.sqlCotizacionesOk = false;

  L.getSb = function () {
    return global.__limajeSupabase || null;
  };

  /** Módulo 2 — Cajas equivalentes para una línea de cotización / venta */
  L.lineCajasInventario = function (l, getProdById) {
    if (!l || l.sinInventario || !l.productId) return 0;
    var p = getProdById(l.productId);
    if (!p) return Math.max(0, Number(l.qty) || 0);
    if (l.qtyMode === 'm2' && Number(p.m2PerBox) > 0) {
      var m2 = Number(l.m2) || 0;
      return m2 > 0 ? m2 / Number(p.m2PerBox) : 0;
    }
    if (l.qtyMode === 'piezas' && Number(p.piecesPerBox) > 0) {
      var pz = Number(l.piezas) || 0;
      return pz > 0 ? pz / Number(p.piecesPerBox) : 0;
    }
    return Math.max(0, Number(l.qty) || 0);
  };

  L.enrichCotizItemsForSql = function (lineas, getProdById, cotizSubtotalLine) {
    return (lineas || []).map(function (l) {
      var p = l.productId ? getProdById(l.productId) : null;
      var cj = L.lineCajasInventario(l, getProdById);
      var sub =
        typeof cotizSubtotalLine === 'function'
          ? cotizSubtotalLine(l)
          : (Number(l.price) || 0) * (Number(l.qty) || 1);
      var o = JSON.parse(JSON.stringify(l));
      o.cajasInventario = cj;
      o.priceCost = p ? p.priceCost || 0 : 0;
      o.priceLimit = p ? p.priceLimit || 0 : 0;
      o.unidadMedida = l.qtyMode === 'm2' ? 'm2' : l.qtyMode === 'piezas' ? 'piezas' : 'cajas';
      o.subtotalLinea = sub;
      return o;
    });
  };

  /** Sincroniza existencias físicas (suma lotes = stock por bodega) hacia limaje_stock */
  L.syncStockPhysical = async function (getProducts, ensureStockByLoc, stockAtLoc, LOC_CODES) {
    var sb = L.getSb();
    if (!sb) return { ok: false, skip: true };
    var rows = [];
    getProducts().forEach(function (p) {
      ensureStockByLoc(p);
      LOC_CODES.forEach(function (loc) {
        rows.push({
          product_id: String(p.id),
          location_code: loc,
          cajas_fisicas: Number(stockAtLoc(p, loc)) || 0,
          metros_por_caja: p.m2PerBox != null ? String(p.m2PerBox) : null,
          piezas_por_caja: p.piecesPerBox != null ? String(p.piecesPerBox) : null,
        });
      });
    });
    var r = await sb.rpc('limaje_stock_sync_physical', { p_rows: rows });
    if (r.error) {
      console.warn('limaje_stock_sync_physical', r.error);
      return { ok: false, error: r.error };
    }
    return { ok: true, data: r.data };
  };

  L.fetchStockReservedMap = async function () {
    var sb = L.getSb();
    if (!sb) return {};
    var r = await sb.from('limaje_stock').select('product_id,location_code,cajas_fisicas,cajas_reservadas');
    if (r.error) return {};
    var m = {};
    (r.data || []).forEach(function (row) {
      var k = row.product_id + '|' + row.location_code;
      m[k] = {
        fisicas: Number(row.cajas_fisicas) || 0,
        reservadas: Number(row.cajas_reservadas) || 0,
      };
    });
    return m;
  };

  L.disponibleFromMap = function (map, productId, loc, fallbackFisico) {
    var k = String(productId) + '|' + loc;
    if (!map[k]) return fallbackFisico;
    return Math.max(0, (map[k].fisicas || 0) - (map[k].reservadas || 0));
  };

  /** Pull cotizaciones desde SQL → reemplaza arreglo local si tiene éxito */
  L.pullCotizaciones = async function (mapRowToLocal) {
    var sb = L.getSb();
    if (!sb) return { ok: false };
    var r = await sb
      .from('limaje_cotizaciones')
      .select('*')
      .order('numero_serial', { ascending: false })
      .range(0, 1999);
    if (r.error) {
      console.warn('pull cotizaciones', r.error);
      L.sqlCotizacionesOk = false;
      return { ok: false, error: r.error };
    }
    L.sqlCotizacionesOk = true;
    var list = (r.data || []).map(mapRowToLocal);
    return { ok: true, list: list };
  };

  L.upsertCotizacionRpc = async function (payload) {
    var sb = L.getSb();
    var r = await sb.rpc('limaje_cotizacion_upsert', { p: payload });
    if (r.error) throw r.error;
    return r.data;
  };

  L.reservarRpc = async function (cotizUuid, lines) {
    var sb = L.getSb();
    var r = await sb.rpc('limaje_cotizacion_reservar', {
      p_cotizacion_id: cotizUuid,
      p_lines: lines,
    });
    if (r.error) throw r.error;
    return r.data;
  };

  L.liberarReservaRpc = async function (cotizUuid) {
    var sb = L.getSb();
    var r = await sb.rpc('limaje_cotizacion_liberar_reserva', { p_cotizacion_id: cotizUuid });
    if (r.error) throw r.error;
    return r.data;
  };

  L.confirmarCotizacionRpc = async function (cotizUuid, ventaMeta) {
    var sb = L.getSb();
    var r = await sb.rpc('limaje_cotizacion_confirmar', {
      p_cotizacion_id: cotizUuid,
      p_venta_meta: ventaMeta,
    });
    if (r.error) throw r.error;
    return r.data;
  };

  /** Solo rol configurador en servidor — borra todas las filas limaje_cotizaciones (+ reservas/demanda). */
  L.purgeAllCotizacionesConfiguradorRpc = async function () {
    var sb = L.getSb();
    var r = await sb.rpc('limaje_configurador_purge_all_cotizaciones');
    if (r.error) throw r.error;
    return r.data;
  };

  L.resetKvConfiguradorRpc = async function (epoch) {
    var sb = L.getSb();
    var r = await sb.rpc('limaje_configurador_reset_kv', { p_epoch: Number(epoch) || Date.now() });
    if (r.error) throw r.error;
    return r.data;
  };

  L.abastecimientoCubrirRpc = async function (productId, locationCode) {
    var sb = L.getSb();
    var r = await sb.rpc('limaje_abastecimiento_intentar_cubrir', {
      p_product_id: String(productId),
      p_location_code: locationCode,
    });
    if (r.error) console.warn('abastecimiento_cubrir', r.error);
    return r.data;
  };

  /** Módulo 3 — Bloqueo inactividad */
  L.inactivityMs = function () {
    try {
      var p = global.DB && global.DB.get ? global.DB.get('app_prefs', {}) : {};
      var m = parseInt(p.inactivityLockMinutes, 10);
      if (!isFinite(m) || m < 1) m = 15;
      return m * 60 * 1000;
    } catch (e) {
      return 15 * 60 * 1000;
    }
  };

  L.sha256Hex = async function (text) {
    var enc = new TextEncoder().encode(text);
    var buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
  };

  /** Tras inactividad: cierra sesión (Supabase) para volver a login con credenciales. Sin modal de PIN. */
  L.setupInactivityLock = function () {
    var ov = document.getElementById('limajeLockOverlay');
    if (ov) ov.classList.remove('visible');
    var timer = null;
    var reset = function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (typeof global.logout === 'function') void global.logout();
        else if (global.__limajeSupabase && global.__limajeSupabase.auth) void global.__limajeSupabase.auth.signOut();
      }, L.inactivityMs());
    };
    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function (ev) {
      document.addEventListener(
        ev,
        function () {
          reset();
        },
        { passive: true }
      );
    });
    reset();
  };

  /** Módulo 6 — Presencia */
  L.presenceChannel = null;
  L.presenceTimer = null;
  L.presenceResource = null;

  L.presenceStart = function (resourceType, resourceId, userLabel) {
    var sb = L.getSb();
    if (!sb || !resourceId) return;
    L.presenceStop();
    L.presenceResource = { type: resourceType, id: resourceId };
    var chName = 'limaje-pres-' + resourceType + '-' + resourceId;
    L.presenceChannel = sb
      .channel(chName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'limaje_presence', filter: 'resource_id=eq.' + resourceId },
        function () {
          if (typeof global.limajeOnPresenceRemote === 'function') global.limajeOnPresenceRemote();
        }
      )
      .subscribe();
    var ping = function () {
      void sb.rpc('limaje_presence_ping', {
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_label: userLabel || '',
      });
    };
    ping();
    L.presenceTimer = setInterval(ping, 20000);
  };

  L.presenceStop = function () {
    var sb = L.getSb();
    if (L.presenceTimer) {
      clearInterval(L.presenceTimer);
      L.presenceTimer = null;
    }
    if (L.presenceChannel && sb) {
      sb.removeChannel(L.presenceChannel);
      L.presenceChannel = null;
    }
    if (sb && L.presenceResource) {
      void sb.rpc('limaje_presence_clear', {
        p_resource_type: L.presenceResource.type,
        p_resource_id: L.presenceResource.id,
      });
    }
    L.presenceResource = null;
  };

  L.presenceFetchOthers = async function (resourceType, resourceId, myUserId) {
    var sb = L.getSb();
    if (!sb) return [];
    var r = await sb
      .from('limaje_presence')
      .select('user_id,user_label,last_seen')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId);
    if (r.error) return [];
    var cutoff = Date.now() - 45000;
    return (r.data || []).filter(function (row) {
      if (String(row.user_id) === String(myUserId)) return false;
      var t = new Date(row.last_seen).getTime();
      return t >= cutoff;
    });
  };

  /** Módulo 4 — Periodos */
  L.fetchPeriodos = async function () {
    var sb = L.getSb();
    if (!sb) return [];
    var r = await sb.from('limaje_periodos').select('*').order('fecha_inicio', { ascending: false });
    if (r.error) return [];
    return r.data || [];
  };

  L.togglePeriodoCerrado = async function (periodoId, cerrado) {
    var sb = L.getSb();
    if (!sb) throw new Error('Sin conexión');
    var r = await sb.from('limaje_periodos').update({ cerrado: !!cerrado }).eq('id', periodoId);
    if (r.error) throw r.error;
    return r;
  };

  /** Módulo 7 — Actividad SQL */
  L.fetchAuditoria = async function (from, to, limit) {
    var sb = L.getSb();
    if (!sb) return [];
    var q = sb
      .from('limaje_auditoria')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit || 200);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    var r = await q;
    if (r.error) return [];
    return r.data || [];
  };

  /** Módulo 5 — CSV */
  L.downloadCsv = function (filename, rows) {
    if (!rows || !rows.length) {
      global.alert2 && global.alert2('Sin filas para exportar', 'error');
      return;
    }
    var keys = Object.keys(rows[0]);
    var esc = function (v) {
      var s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    var lines = [keys.join(',')].concat(
      rows.map(function (row) {
        return keys.map(function (k) {
          return esc(row[k]);
        }).join(',');
      })
    );
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  L.parseCsv = function (text) {
    var rows = [];
    var cur = [];
    var field = '';
    var i = 0,
      inQ = false;
    while (i < text.length) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQ = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }
      if (c === '"') {
        inQ = true;
        i++;
        continue;
      }
      if (c === ',') {
        cur.push(field);
        field = '';
        i++;
        continue;
      }
      if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
        i++;
        continue;
      }
      field += c;
      i++;
    }
    cur.push(field);
    if (cur.length > 1 || (cur.length === 1 && cur[0] !== '')) rows.push(cur);
    return rows;
  };

  L.validateCsvHeaders = function (rows, required) {
    if (!rows || rows.length < 2) return { ok: false, error: 'Archivo vacío o sin datos.' };
    var h = rows[0].map(function (x) {
      return String(x || '')
        .trim()
        .toLowerCase();
    });
    var miss = required.filter(function (k) {
      return h.indexOf(k.toLowerCase()) < 0;
    });
    if (miss.length) return { ok: false, error: 'Faltan columnas obligatorias: ' + miss.join(', ') };
    return { ok: true, headers: h };
  };
})(typeof window !== 'undefined' ? window : globalThis);
