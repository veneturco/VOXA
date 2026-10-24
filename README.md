# SPOKI-AI SAAS (V4.0 FUSIÓN DEFINITIVA)
### Plataforma Multiempresa de Recepcionista IA, Voz Neural y CRM Invisible para WhatsApp

Plataforma SaaS funcional de punta a punta orientada a negocios de atención masiva (Clínicas Médicas, Talleres/Repuestos Automotrices y Tiendas con Delivery). Automatiza la atención por WhatsApp integrando razonamiento multimodal (**texto, notas de voz `.ogg`/`.mp3` e imágenes de comprobantes de pago**), deduplicación estricta y persistencia híbrida automática.

---

## 🌟 Características Principales

1. **Single-Pass con `@google/genai` (`gemini-2.5-flash`)**:
   - En **una sola llamada multimodal estructurada por turno**, analiza el mensaje o imagen, responde al cliente, actualiza el perfil en el CRM Invisible, asigna el score de compra (0 a 100) y extrae borradores de citas, pedidos o comprobantes.
   - Protege la cuota de la capa gratuita (15 RPM) sin generar llamadas redundantes.

2. **Sin Etiquetas Ruidosas en el Audio**:
   - El texto generado para el cliente (`reply_to_customer`) está 100% limpio de etiquetas de control (como `[PEDIDO_CONFIRMADO]`), listo para ser reproducido en notas de voz de alta fidelidad.

3. **Verificación Humana Obligatoria en Pagos**:
   - Cuando un cliente envía una imagen o texto de comprobante bancario, Gemini Vision extrae banco, referencia, fecha y monto, pero el estado se almacena siempre como `pendiente_de_verificacion` para validación humana.

4. **Human Handover Persistente**:
   - Pausa el bot IA por conversación con un solo clic. El backend almacena el estado `bot_paused: true` y bloquea cualquier respuesta automática hasta que el operador decida reactivarlo.

5. **Deduplicación de Webhook**:
   - Registro persistente de cada `wa_message_id` para evitar respuestas duplicadas ante reintentos de red de Meta.

6. **Desvío Inteligente de Llamadas**:
   - Soporte para eventos `calls` en el Webhook de WhatsApp Business Calling API. Si el desvío está habilitado, rechaza cortésmente la llamada y envía de inmediato un mensaje y nota de voz explicativa al chat.

7. **Persistencia Híbrida Automática**:
   - **Modo Local Inmediato**: Si no se configuran credenciales de Firebase, el sistema utiliza persistencia local en JSON (`backend/data/db.json`). La plataforma arranca y opera al 100% sin configuraciones iniciales.
   - **Modo Cloud Firestore**: Se activa automáticamente al configurar `FIREBASE_SERVICE_ACCOUNT` en `backend/.env`.

---

## 📁 Estructura del Proyecto

```
Voxa/
├── backend/
│   ├── src/
│   │   ├── config/templates.ts       # Plantillas de Clínica, Taller y Tienda Delivery
│   │   ├── routes/
│   │   │   ├── api.ts                # Endpoints REST de configuración, leads, simulador y transacciones
│   │   │   └── webhook.ts            # Webhook de Meta WhatsApp Cloud API y Calling API
│   │   ├── services/
│   │   │   ├── gemini.ts             # SDK oficial @google/genai (Single-Pass gemini-2.5-flash)
│   │   │   ├── storage.ts            # Persistencia híbrida (Firestore vs JSON local)
│   │   │   ├── tts.ts                # Síntesis de voz con msedge-tts y conversión ffmpeg
│   │   │   └── whatsapp.ts           # Cliente para envío de texto y notas de voz por Meta Graph API
│   │   ├── types/index.ts            # Esquemas Zod y tipado TypeScript
│   │   └── index.ts                  # Servidor Express y directorio estático de audio
│   ├── data/db.json                  # Base de datos local autogenerada
│   ├── public/audio/                 # Notas de voz generadas por TTS
│   ├── public/uploads/               # Comprobantes y audios subidos por clientes
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardView.tsx     # Vista 1: Resumen Operativo y KPIs
│   │   │   ├── ConfigView.tsx        # Vista 2: Entrenador y selector de plantillas
│   │   │   ├── SimulatorView.tsx     # Vista 3: Simulador WhatsApp + Inspector en tiempo real
│   │   │   ├── CrmTransactionsView.tsx # Vista 4: CRM Invisible y validación de pagos
│   │   │   ├── HandoverInboxView.tsx # Vista 5: Bandeja de entrada y Human Handover
│   │   │   └── IntegrationsView.tsx  # Vista 6: Diagnóstico de integraciones y Webhook
│   │   ├── App.tsx                   # Layout ejecutivo en Dark Mode
│   │   ├── main.tsx
│   │   └── index.css                 # Tailwind CSS v4 styling
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Variables de Entorno del Backend
Copia el archivo de ejemplo en el backend:
```bash
cp backend/.env.example backend/.env
```
*(Opcional: Si deseas usar la IA real de inmediato, coloca tu `GEMINI_API_KEY` en `backend/.env`. De lo contrario, el sistema operará en su simulador inteligente).*

### 2. Iniciar el Backend
```bash
cd backend
npm run build
npm start
```
El servidor backend se ejecutará en: `http://localhost:4000`

### 3. Iniciar el Frontend
En otra terminal:
```bash
cd frontend
npm run dev
```
La aplicación web se abrirá en: `http://localhost:5173`

---

## 📱 Vistas Disponibles en la Plataforma

1. **Resumen Operativo (Dashboard KPI)**: Estado de salud de Gemini, base de datos (Firestore vs Local JSON), llamadas a Meta, leads calientes (`buying_score >= 80`) y comprobantes por validar.
2. **Entrenador del Asistente**: Selector de 1 clic para **Clínicas Médicas**, **Talleres Mecánicos** y **Tiendas con Delivery**, editor de catálogo y vista previa en vivo del `system_prompt` generado.
3. **Simulador Interactivo + Inspector**: Teléfono WhatsApp a la izquierda (texto, audio, fotos de comprobante y simulación de llamada entrante) e **Inspector de Magia Operativa** a la derecha con termómetro visual de compra y CRM invisible autocompletado.
4. **CRM & Transacciones**: Tabla de leads comerciales y pestaña de comprobantes de pago con botones de aprobación y rechazo humano.
5. **Bandeja de Entrada & Control Humano**: Historial de chats con botón para pausar/reactivar la IA y responder manualmente.
6. **Estado de Integraciones**: Diagnóstico en vivo de credenciales y URL del Webhook para Meta for Developers.
