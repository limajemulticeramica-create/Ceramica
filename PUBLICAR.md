# Publicar en GitHub y Cloudflare Pages

## 1. GitHub (repositorio)

En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "LIMAJE: app lista para Cloudflare Pages"
```

Crea un repositorio vacío en GitHub (sin README si ya tienes commit local), luego:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

`limaje-config.js` **no se sube** (está en `.gitignore`). Las credenciales van en Cloudflare como variables de entorno (paso 3).

---

## 2. Cloudflare Pages — nuevo proyecto

1. Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autoriza GitHub y elige el repositorio y la rama `main`.
3. Configuración de compilación:

| Campo | Valor |
|--------|--------|
| **Framework preset** | None |
| **Build command** | `npm run build` |
| **Build output directory** | **`/`** raíz del proyecto (si pones otra carpeta tipo `dist`, la app se rompe: los `.js` no se encuentran). |

4. **Environment variables** (Production y Preview si quieres):

| Nombre | Valor |
|--------|--------|
| `LIMAJE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `LIMAJE_SUPABASE_ANON_KEY` | tu anon key (`eyJ...`) |

5. **Save and Deploy**.

El comando `npm run build` genera `limaje-config.js` (con tus variables) y copia la lógica a **`limaje-p1.js` … `limaje-p4.js`** en la **raíz** (sin carpetas `database/`, etc.), que es lo que carga `Limaje.html`. Así Cloudflare no devuelve HTML en lugar de JavaScript.

Sube esos **cuatro archivos** a GitHub cuando cambies el código, o deja que Cloudflare los regenere con `npm run build` si la salida del sitio es la raíz **`/`**.

---

## 3. Supabase

En **Authentication → URL Configuration**, añade la URL de tu sitio Pages, por ejemplo:

`https://tu-proyecto.pages.dev`

(y tu dominio personalizado si lo configuras).

---

## 4. Proyecto ya existente en Cloudflare

Si el proyecto Pages ya está enlazado al mismo repo: cada `git push` a la rama conectada **vuelve a desplegar** solo. Asegúrate de que **Build command** sea `npm run build` y de tener las variables de entorno definidas.

---

## Netlify (alternativa)

Este repo incluye `netlify.toml`. Allí también puedes definir `LIMAJE_SUPABASE_URL` y `LIMAJE_SUPABASE_ANON_KEY` en **Site settings → Environment variables** y usar build command `npm run build`.
