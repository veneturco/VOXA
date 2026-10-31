# 🛡️ VOXA (by VENE TURCO) - Manual de Seguridad, Blindaje SecOps y Despliegue 24/7

Este documento detalla la arquitectura de seguridad y estabilidad implementada en **VOXA v5.5 Enterprise** tras la auditoría profunda de ciberseguridad.

---

## 🔒 1. Medidas de Seguridad Activas (7 Fases de Blindaje)

### Fase 1: Cero Secretos en Cliente y Ocultamiento de Huella
* **Sin Llaves en Frontend**: Ningún archivo en `frontend/src/` contiene API keys ni variables `VITE_`. Todas las invocaciones a Gemini 2.5 Flash, TTS y bases de datos se orquestan en el backend.
* **Sourcemaps Desactivados**: Configurado `build: { sourcemap: false }` en `vite.config.ts`, imposibilitando la ingeniería inversa del código original desde DevTools.
* **Aislamiento Estricto de Archivos**: Express bloquea con código HTTP 403 cualquier intento de acceso directo por URL a archivos como `.env`, `package.json`, `creds.json`, carpetas `auth_sessions/` o backups locales.
* **Cabeceras con Helmet**: Desactivada la cabecera `X-Powered-By`, activado `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff` y CSP ajustada para React y Vite.
* **Manejo de Errores Seguro**: Middleware global que captura cualquier excepción y responde con un mensaje genérico, impidiendo la fuga de rutas internas (*stack traces*).

### Fase 2: Autenticación Sincronizada y CORS Estricto
* **Credencial Maestra (`ADMIN_SECRET_KEY`)**: Todos los endpoints de `/api/*` están protegidos. El panel de React cuenta con un modal de acceso vidriado (`AuthModal.tsx`) que solicita la clave y la almacena en el navegador, enviándola en la cabecera `X-Admin-Key` mediante interceptores de Axios.
* **CORS Restringido**: Configurado para admitir exclusivamente peticiones desde el dominio de producción `https://voxa-hk3e.onrender.com` y los entornos locales de desarrollo.

### Fase 3: Protección de Privacidad (PII) y Aislamiento de Contexto
* **Sanitización de Texto**: El motor TTS limpia caracteres de escape antes de invocar a Edge-TTS o FFmpeg.
* **Aislamiento Multiusuario**: El historial de conversación se segmenta en memoria por el número de teléfono único del cliente (`remoteJid`), impidiendo cualquier cruce de datos o pedidos entre clientes distintos.
* **Logs Limpios**: Se redactan datos sensibles para que no queden registrados en texto plano en los logs de Render.

### Fase 4: Anti-DDoS, Proxy en Render y Protección contra Prompt Injection
* **Configuración de Proxy (`trust proxy: 1`)**: Express detecta correctamente la IP real del usuario detrás del balanceador de Render.
* **Rate Limiting por IP**: Límite general de 120 peticiones/min para la API y límite estricto de 10 intentos/min para autenticación contra ataques de fuerza bruta.
* **Rate Limiting en WhatsApp**: Si un mismo número envía más de 10 mensajes en 60 segundos, entra en enfriamiento automático para proteger la cuota de la API de Gemini.
* **Anti-Prompt Injection**: Se utiliza `systemInstruction` estricto en Gemini delimitando el texto del cliente para evitar que intente cambiar precios o instrucciones.
* **Límite de Carga**: Tamaño máximo de payloads JSON limitado a 2MB.

### Fase 5: Operación 24/7 y Zero-Crash
* **Protección contra Caídas**: Captura de eventos `uncaughtException` y `unhandledRejection` para evitar el apagado imprevisto del proceso Node.js.
* **Limpieza de Disco y Memoria**: Borrado automático de archivos de audio temporales con más de 25 minutos de antigüedad y límite de 10 turnos por conversación.
* **Graceful Shutdown**: Manejo de señales `SIGTERM` y `SIGINT` para un cierre limpio del servidor cuando Render realiza despliegues.
* **Endpoint `/health` Público**: Ruta ultraligera que responde `{ status: "ok", uptime: ... }` para UptimeRobot y balanceadores.

---

## 🔑 2. Variables de Entorno Requeridas en Render

En tu panel de control de Render (**Dashboard > VOXA Web Service > Environment**), debes asegurarte de contar con las siguientes variables:

| Variable | Valor Recomendado | Propósito |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20.18.0` | Versión estable de Node.js |
| `NODE_ENV` | `production` | Activa optimizaciones de producción |
| `ADMIN_SECRET_KEY` | *(Crea una clave segura, ej: `voxa_sec_8f92a10b4c7`)* | **Nueva**: Protege la API y el acceso al panel |
| `GEMINI_API_KEY` | *(Tu API Key de Google AI Studio)* | Motor de Inteligencia Artificial Gemini 2.5 Flash |
| `PUBLIC_BASE_URL` | `https://voxa-hk3e.onrender.com` | Enlaces públicos para audios y Keep-Alive |
| `META_WA_VERIFY_TOKEN` | *(Tu token de verificación Meta)* | Conexión con WhatsApp Cloud API (opcional) |
| `META_WA_PHONE_NUMBER_ID`| *(ID de teléfono de Meta)* | Envío de mensajes oficiales (opcional) |
| `META_WA_ACCESS_TOKEN` | *(Token de acceso permanente de Meta)* | Autorización de Meta Cloud API (opcional) |

---

## 🖥️ 3. Cómo Funciona el Acceso de Administrador en el Frontend

1. Al abrir la aplicación en `https://voxa-hk3e.onrender.com`, si es la primera vez que ingresas, aparecerá una pantalla de bloqueo pidiéndote la **Credencial Maestra**.
2. Escribe la misma clave que configuraste en `ADMIN_SECRET_KEY` en Render y haz clic en **Acceder al Workspace**.
3. **Acceso Rápido por Enlace**: Puedes guardar en tus favoritos el enlace con la clave agregada como parámetro (ej: `https://voxa-hk3e.onrender.com?key=TU_CLAVE`). El sistema la guardará automáticamente en tu navegador y limpiará la URL para mayor discreción.
4. En el pie del menú lateral encontrarás el botón rojo de **Cerrar Sesión** para bloquear la consola en cualquier momento.

---

## ⏱️ 4. Configuración de UptimeRobot (Operación 24/7 sin Apagados)

Para garantizar que el servidor permanezca despierto de forma ininterrumpida:
1. Crea una cuenta gratuita en [UptimeRobot.com](https://uptimerobot.com/).
2. Haz clic en **+ Add New Monitor**.
3. Configuración:
   * **Monitor Type**: `HTTP(s)`
   * **Friendly Name**: `VOXA Production`
   * **URL (or IP)**: `https://voxa-hk3e.onrender.com/health`
   * **Monitoring Interval**: `Every 5 minutes` (o 10 minutes)
4. Guarda el monitor. Con esta consulta periódica al endpoint `/health`, Render mantendrá el contenedor activo las 24 horas del día.
