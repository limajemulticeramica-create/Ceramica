# Versión refactorizada

La **versión en producción** es la **raíz del repositorio** (`Limaje.html`, `scripts/limaje-app-core.js`, etc.).

Esta carpeta no duplica el código completo a propósito: mantener dos copias de ~6 000 líneas habría provocado divergencias y errores en despliegue (Netlify / Cloudflare Pages / PWA).

## Qué sí cambió en la raíz (refactor incremental)

- JavaScript principal extraído a `scripts/limaje-app-core.js`.
- Utilidades: `utils/calculos.js`, `services/reportes.js`, `database/supabaseClient.js`.
- Funciones opcionales en `functions/` para cierres calculados en servidor.
- Documentación en `documentacion_codigo/`.

Si en el futuro se desea una **rama o carpeta espejo** completa, se puede generar copiando la raíz con un script de CI; no se recomienda editar manualmente dos árboles paralelos.
