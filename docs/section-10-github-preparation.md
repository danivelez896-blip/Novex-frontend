# Sección 10 — preparación de sincronización con GitHub (frontend)

Fecha: 17 de octubre de 2026. Rama: `feature/section-8-exchange-ui`.

## Alcance y autorización

El usuario autorizó commits selectivos locales en las ramas actuales. Este informe documenta la selección revisada y sus comprobaciones; no autoriza push, merge, despliegues ni ejecuciones remotas. Presupuesto adicional: **0 €**. No se modifican configuración remota, producción, credenciales, archivos de entorno ni datos reales.

- Rutas, páginas y formularios del portal adaptados al bearer y a la sesión en memoria.
- Borradores, fotografías, caducidad, aislamiento por pedido y recuperación sin reintentos ciegos.
- Pruebas del contrato real de autorización y navegador con APIs simuladas.
- Playwright, workflow, instrucciones permanentes y actualización del informe de fotografías.

## Inventario exacto de cambios seleccionados

36 archivos añadidos o modificados; 36 entradas en total. A = nuevo, M = modificado, D = retirado del árbol Git.

```text
M .github/workflows/exchanges-ui-ci.yml
M .gitignore
M AGENTS.md
M app/api/public/returns/cases/[publicId]/route.ts
M app/api/public/returns/drafts/[token]/route.ts
M app/api/public/returns/orders/[publicId]/cases/route.ts
M app/api/public/returns/orders/[publicId]/drafts/route.ts
M app/api/public/returns/orders/[publicId]/route.ts
A app/api/public/returns/shopify/order-link/route.ts
M app/api/return-photos/route.ts
M app/api/return-photos/view/route.ts
M app/cases/[id]/page.tsx
M app/orders/OrdersTable.tsx
M app/orders/page.tsx
A app/return/PortalSession.tsx
M app/return/[id]/ReturnRequestForm.tsx
M app/return/[id]/page.tsx
M app/return/[id]/success/[caseId]/page.tsx
A app/return/layout.tsx
M app/return/mobile/[token]/page.tsx
A docs/section-10-github-preparation.md
A docs/section-10-portal-validation.md
A docs/section-10-pre-github-audit.md
M eslint.config.mjs
A lib/portal-authorization.ts
A lib/portal-photos.ts
A lib/portal-route.ts
M package-lock.json
M package.json
A playwright.config.ts
A tests/browser/portal.spec.ts
A tests/portal-authorization.test.mjs
A tests/portal-backend-contract.test.mjs
A tests/portal-photos.test.mjs
A tests/portal-routes.test.mjs
M tsconfig.json
```

## Exclusiones y conservación

- `.env.local` y otros archivos locales de entorno, claves/credenciales, copias privadas, `.local-audit/`, `.railway/`, `.vercel/`, `node_modules/`, `.next/`, `next-env.d.ts`, `*.tsbuildinfo`, cobertura y resultados Playwright no forman parte del commit.
- El archivo `.env.staging.example` ya estaba versionado: no se modifica ni se incluye entre los cambios del commit. Es una plantilla, no una credencial de este entorno.
- Se verifican hashes del trabajo previo, los archivos protegidos y las copias originales. Los respaldos privados permanecen fuera de ambos repositorios; no se incluyen archivos bundle, parches privados ni manifiestos de respaldo.
- `package-lock.json` se incluye intencionadamente para reproducir las dependencias; coincide con `package.json` y sus fuentes resueltas pertenecen al registro npm esperado. No es una caché generada que deba excluirse.
- El escaneo heurístico de todos los archivos versionados y candidatos no detectó secretos reales. Las coincidencias corresponden a fixtures sintéticos y conexiones locales de prueba. No equivale a una auditoría de todo el historial Git ni de secretos remotos.

## Verificación ejecutada sobre este árbol

Entorno local: macOS, Node 24.20.0. Proveedores y almacenamiento simulados. Las variables de los procesos de prueba mantienen `NOVEX_ENV=staging`, los flags económicos en `false` y los endpoints de prueba en loopback; no se editaron archivos de entorno. Los tests de políticas que simulan opt-ins no activan proveedores reales.

| Comprobación | Resultado |
| --- | --- |
| ESLint | 0 errores; 1 advertencia conocida por imagen protegida del panel |
| Compilación Next.js | Correcta |
| TypeScript sin emisión/incremental | Correcto antes y después de Playwright |
| `test:portal` | 27 superadas |
| `test:exchanges` | 7 superadas |
| `test:portal:backend` | 3 superadas contra el backend recompilado |
| Playwright Chromium, escritorio y Pixel 7 emulado | 20 superadas; 0 fallos/omisiones |
| Coherencia de manifiesto/lockfile y revisión estática de workflows | Correctas |
| Preservación del trabajo y selección Git | Verificación por hashes e inventario explícito |

Los 37 resultados locales son 27 + 7 + 3; las pruebas cruzadas no se cuentan otra vez como una batería adicional. El contenido previo completo de `AGENTS.md`, incluido el bloque de Next.js, se conserva. Las comprobaciones del navegador se ejecutaron solo contra localhost y APIs simuladas, con los navegadores ya instalados.

No se ejecutó una nueva consulta remota de `npm audit`: los avisos de dependencias descritos en la auditoría anterior se mantienen como antecedentes pendientes de reevaluación, no como un resultado nuevo. No se instalaron dependencias ni se solicitaron recursos de pago.

## Compatibilidad entre repositorios

Las tres pruebas cruzadas importan el backend compilado y su firma/guard reales, con persistencia simulada. Verifican aceptación del grant y rechazo por firma, caducidad, pedido, cliente, tienda o empresa. El frontend conserva bearer, fragmento retirado de la URL y autorizaciones solo en memoria. La corrección `requirePhotos` conserva rutas, cuerpos y respuestas: el frontend sube la imagen del borrador y el backend verifica bucket privado, existencia, bytes, hash y ámbito de manera independiente. Las pruebas de fotos son simuladas; no acreditan una configuración real de almacenamiento.

## Riesgos antes de publicar

1. Los workflows incluidos tienen disparadores `push` de estas ramas y PR hacia `main`. Un push futuro puede consumir minutos y almacenamiento de GitHub Actions; confirmar cuota incluida, límites de gasto y ausencia de recargas antes de autorizarlo. No se ejecutaron Actions remotas en esta preparación.
2. Los workflows locales no contienen despliegues ni usan secretos de proveedores. Esto no descarta integraciones Git externas: Railway, Vercel, previews, webhooks y deploy hooks deben verificarse en las cuentas autorizadas antes de publicar. No se inspeccionaron ni cambiaron ajustes remotos.
3. CI remoto Linux/Node 22 sigue pendiente. El resultado local no demuestra una ejecución GitHub Actions. Las pruebas cruzadas requieren ambos checkouts y backend compilado; el workflow frontend de un solo checkout no las ejecuta.
4. El recorrido real Shopify → enlace → portal y las credenciales/políticas/retención del bucket deben comprobarse en un entorno autorizado. Las operaciones económicas siguen deshabilitadas; los casos Sendcloud sin referencia verificable continúan bloqueados, sin reintentos de compra ni confirmaciones basadas en suposiciones.
5. Los avisos previos de herramientas de desarrollo y las deprecaciones documentadas requieren seguimiento. No impiden conservar el trabajo en commits locales, pero esta preparación no acredita el cierre de esos riesgos ni habilita producción.

Los identificadores de los commits finales se entregan en el informe al usuario; la autorización actual termina en el almacenamiento Git local.
