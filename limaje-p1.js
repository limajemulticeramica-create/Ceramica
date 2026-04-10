/* LIMAJE — generado por npm run bundle; no editar a mano */
/**
 * Cliente Supabase (navegador) — lectura de configuración y factoría opcional.
 * La app principal sigue usando window.__limajeSupabase creado en bootLimajeApp (scripts/limaje-app-core.js).
 * Este módulo centraliza URL/anon key para reutilizar en nuevos módulos sin duplicar validación.
 */
(function (global) {
  'use strict';

  var NS = (global.LimajeDatabase = global.LimajeDatabase || {});

  NS.getSupabaseConfig = function () {
    return {
      url: typeof global.LIMAJE_SUPABASE_URL === 'string' ? global.LIMAJE_SUPABASE_URL : '',
      anonKey: typeof global.LIMAJE_SUPABASE_ANON_KEY === 'string' ? global.LIMAJE_SUPABASE_ANON_KEY : '',
    };
  };

  NS.isConfigured = function () {
    var c = NS.getSupabaseConfig();
    if (c.url.length < 16 || c.anonKey.length < 40) return false;
    if (c.url.indexOf('placeholder') >= 0 || c.anonKey.indexOf('placeholder') >= 0) return false;
    if (c.url.indexOf('http') !== 0) return false;
    if (c.anonKey.indexOf('eyJ') !== 0) return false;
    return true;
  };

  NS.createBrowserClient = function () {
    var lib =
      typeof global.supabase !== 'undefined' && global.supabase.createClient
        ? global.supabase
        : typeof global.window !== 'undefined' &&
            global.window.supabase &&
            global.window.supabase.createClient
          ? global.window.supabase
          : null;
    if (!lib) return null;
    var c = NS.getSupabaseConfig();
    if (!c.url || !c.anonKey) return null;
    return lib.createClient(c.url, c.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
