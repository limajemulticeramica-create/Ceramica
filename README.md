# Multi-cerámica LIMAJE

Sistema de gestión (HTML + Supabase). **GitHub + Netlify**.

## 1. Claves Supabase (login)

Edite **`limaje-config.js`**: ponga **Project URL** y **anon public** (Supabase → *Project Settings* → *API*).

- Repo **público** en GitHub: no haga *commit* de claves reales; use **repo privado** o edite solo en Netlify tras desplegar.
- Ese archivo ya viene en el repo con cadenas vacías (no rompe el sitio).

## 2. Base de datos

En Supabase → *SQL Editor*, ejecute **todo** `supabase/schema.sql`.

## 3. Imágenes (en la raíz del repo, junto a `Limaje.html`)

Suba **`logo.png`**, **`icon-192.png`** y **`icon-512.png`** en la **misma carpeta** que `Limaje.html` (no hace falta carpeta `assets/`). Opcional: `icon-source.png`.

## Archivos que no deben faltar en GitHub

| Archivo | Para qué |
|---------|----------|
| `Limaje.html` | App |
| `limaje-config.js` | URL y clave Supabase (**si falta, no hay login**) |
| `logo.png`, `icon-192.png`, `icon-512.png` | Logo y PWA / favicon |
| `manifest.json`, `sw.js`, `netlify.toml` | Instalar app y Netlify |
| `index.html` | Redirección opcional |
| `supabase/schema.sql` | Copiar y ejecutar en Supabase (no corre en Netlify) |
| `.gitignore` | Evita subir `node_modules` |

## 4. Subir a GitHub

```bash
git init
git add .
git commit -m "LIMAJE"
git branch -M main
git remote add origin https://github.com/USUARIO/REPO.git
git push -u origin main
```

## 5. Netlify

*Nuevo sitio desde Git* → mismo repositorio → directorio de publicación **`.`** (raíz). El archivo `netlify.toml` ya está configurado.

En Supabase → *Authentication* → *URL configuration*: ponga la URL de Netlify en *Site URL* y *Redirect URLs*.

## Roles (`profiles.role`)

`admin`, `configurador`, `contador`, `vendedor`, `bodeguero`, `auxiliar_bodega`.
