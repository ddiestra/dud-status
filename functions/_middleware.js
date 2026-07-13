/**
 * Basic Auth middleware — protege todo el sitio.
 *
 * Credenciales: variables de entorno BA_USER y BA_PASS
 * (se configuran en el dashboard de Cloudflare o vía wrangler,
 *  NUNCA se escriben en este archivo).
 *
 * Soporta múltiples usuarios opcionalmente vía BA_USERS:
 *   BA_USERS = "usuario1:clave1,usuario2:clave2"
 */
export async function onRequest(context) {
  const { request, next, env } = context;

  const authHeader = request.headers.get("Authorization") || "";

  // Construir lista de credenciales válidas
  const validCreds = [];
  if (env.BA_USER && env.BA_PASS) {
    validCreds.push(`${env.BA_USER}:${env.BA_PASS}`);
  }
  if (env.BA_USERS) {
    for (const pair of env.BA_USERS.split(",")) {
      const trimmed = pair.trim();
      if (trimmed.includes(":")) validCreds.push(trimmed);
    }
  }

  // Si no hay credenciales configuradas, bloquear todo (fail-closed)
  if (validCreds.length === 0) {
    return new Response(
      "Configuración incompleta: define BA_USER y BA_PASS en las variables de entorno del proyecto.",
      { status: 503 }
    );
  }

  if (authHeader.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(authHeader.slice(6));
    } catch (_) {
      /* header malformado -> cae al 401 */
    }
    // Comparación en tiempo constante aproximada
    const ok = validCreds.some((cred) => timingSafeEqual(decoded, cred));
    if (ok) {
      const response = await next();
      // Evitar que navegadores/proxies cacheen contenido protegido
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }

  return new Response("Autenticación requerida.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Status DUD", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) {
    // seguir comparando contra sí mismo para no filtrar longitud por timing
    let dummy = 0;
    for (let i = 0; i < ab.length; i++) dummy |= ab[i] ^ ab[i];
    return false;
  }
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}
