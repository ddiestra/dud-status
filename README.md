# Status DUD — Cloudflare Pages con Basic Auth

Presentación web de **Status Semanal** del proyecto **Directorio Único de
Docentes (DUD)**, con el estilo del **Brand Book Universidad Continental 2025**
(morado / lila / celeste / rosado, tipografía Poppins). Protegida con
autenticación básica mediante Pages Functions.

Reutiliza el mismo motor de slides que el deck de `kickoff/` (navegación por
teclado, click, swipe y barra de progreso), reskineado a la paleta de marca.

## Estructura

```
status/
├── index.html                  # La presentación (arranca con Semana 1)
├── functions/
│   └── _middleware.js          # Basic Auth (protege todo el sitio)
├── wrangler.toml               # Config del proyecto
├── .gitignore
├── .dev.vars.example
└── README.md
```

## Agregar una nueva semana

El motor deriva el total de slides del número de `<section class="slide">`,
así que basta con duplicar la slide de status (`SLIDE 2`) y actualizar el
número/rango de fechas de la semana y los tiles de cada columna
(Completado / En curso / Próximos pasos / Riesgos). No hay que tocar el JS.

## Despliegue (5 minutos)

Requisitos: Node.js 18+ y una cuenta gratuita de Cloudflare.

```bash
cd status
npx wrangler login
npx wrangler pages deploy . --project-name dud-status
```

Al terminar imprime la URL pública, algo como:
`https://dud-status.pages.dev`

## Configurar usuario y contraseña

Las credenciales viven como **variables de entorno**, nunca en el código.

**Opción A — CLI (secrets, recomendado):**
```bash
npx wrangler pages secret put BA_USER --project-name dud-status
npx wrangler pages secret put BA_PASS --project-name dud-status
```

**Opción B — Dashboard:**
Cloudflare Dashboard → Workers & Pages → dud-status →
Settings → Variables and Secrets → Add:
- `BA_USER` = `seidor` (o el que quieras)
- `BA_PASS` = `una-clave-fuerte`

> Tras agregar variables por dashboard, vuelve a desplegar
> (`npx wrangler pages deploy .`) para que tomen efecto.

**Múltiples usuarios (opcional):** define además `BA_USERS` con formato
`usuario1:clave1,usuario2:clave2`.

## Comportamiento

- Sin credenciales configuradas el sitio responde **503** (fail-closed).
- Con credenciales, el navegador muestra el diálogo nativo de usuario/contraseña.
- El contenido protegido se sirve con `Cache-Control: no-store`.
