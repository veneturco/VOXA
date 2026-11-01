# DIRECTIVAS DE OPERACIÓN (MODO HIPER-EFICIENCIA)

1. **MODO PLAN OBLIGATORIO (Regla 9):** Para cualquier tarea que modifique >2 archivos o cree arquitectura nueva, detenerse. Generar primero un *Implementation Plan Artifact*. No escribir código de producción hasta recibir aprobación explícita.
2. **EJECUCIÓN EN LOOP CERRADO (Regla 2):** Prohibido entregar código a medias o con "TODOs". Ejecutar linter, build y pruebas automáticamente. Si falla, iterar en silencio hasta que compile al 100%.
3. **DELEGACIÓN A SUBAGENTES (Regla 6):** No contaminar la ventana de contexto principal leyendo decenas de archivos. Desplegar un Subagente asíncrono para investigar la base de código, correr scripts pesados de FFmpeg o instalar dependencias, y recibir únicamente su resumen de salida.
4. **ENRUTAMIENTO DE MODELOS (Regla 7):**
   - Razonamiento arquitectónico y debugging crítico -> Modelo Pro.
   - Generación de componentes UI, CRUDs y scripts estándar -> Modelo Flash.
   - Formateo de datos, traducciones y limpieza -> Modelo Flash-Lite o Local.
5. **PROTOCOLO DE COMPACTACIÓN (Regla 8):** Al finalizar cada subtarea aprobada, generar un bloque `<CheckpointSummary>` de máximo 5 líneas con: archivos tocados, estado actual y siguiente paso, preparando el contexto para ejecutar `/compress`.
