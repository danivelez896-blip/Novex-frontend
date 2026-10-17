# Sección 10 — adaptación y validación del portal

> Actualización posterior: [auditoría final antes de GitHub](section-10-pre-github-audit.md). Reejecuta las 57 pruebas, documenta los avisos de dependencias y el bloqueo de despliegues remotos. Las pruebas PostgreSQL pendientes citadas en este informe histórico ya pasaron en el backend: 23/23.

Fecha: 17 de octubre de 2026. Rama conservada: `feature/section-8-exchange-ui`.

La adaptación del frontend al contrato de autorización del backend está aplicada y validada localmente. Se conservaron los cuatro archivos de soporte iniciales y se completaron las páginas y rutas que todavía hacían peticiones anónimas. En esta continuación el backend se consultó en modo de solo lectura: las pruebas cruzadas importan su compilación existente, con datos y credenciales sintéticos.

## Correcciones

- El enlace inicial `/return/<pedido>#access_token=<grant>` se procesa en el navegador. El token se retira de la URL y se mantiene únicamente en memoria; no se guarda en cookies, localStorage ni sessionStorage. Los tokens en la query se eliminan y se rechazan.
- Pedido, borrador, guardado automático, fotos, creación del caso y pantalla de confirmación envían `Authorization: Bearer`. Las rutas del frontend conservan los estados HTTP del backend y responden con `Cache-Control: no-store`, `Vary: Authorization` y `Referrer-Policy: no-referrer`.
- Las credenciales ausentes o caducadas muestran instrucciones para volver a abrir la devolución desde la cuenta de la tienda. Un identificador público o un token de borrador aislado no conceden acceso. Una respuesta 401 antigua no puede invalidar un grant más reciente.
- Se retira el acceso en cambios a otro pedido, caducidad y abandono del documento. La continuación móvil mediante navegación interna mantiene el acceso en memoria; el QR transmite el mismo grant temporal en el fragmento y conserva el origen actual.
- Las rutas públicas requieren una URL de backend explícita y válida. No utilizan el antiguo fallback de producción. Se rechazan rutas manipuladas y cuerpos JSON superiores a 64 KiB. Las peticiones tienen tiempos máximos y no repiten automáticamente mutaciones ante errores de red.
- Cada devolución utiliza un borrador, también cuando no lleva fotos. Las llamadas simultáneas a crear el borrador comparten una promesa; el formulario impide envíos simultáneos. Si se pierde la respuesta del caso, la consulta del mismo borrador permite detectar que ya fue consumido sin repetir el POST.
- Restaurar un borrador debe completarse correctamente antes de permitir guardado y envío. Un error de restauración no sobrescribe el contenido guardado con un formulario vacío. Los borradores consumidos conducen a la confirmación existente.
- Las fotos se suben al borrador antes de crear el caso. Se elimina la antigua vía que escribía adjuntos de casos directamente en Supabase usando solo un publicId.
- La subida comprueba con el backend el acceso, estado, caducidad y capacidad del borrador antes de escribir en almacenamiento. Valida tipo, firma básica de imagen, tamaño y nombre; limita a cinco fotos y el multipart completo a 26 MiB. El servidor genera el nombre y la extensión del objeto; el registro vuelve a pasar por el backend con el mismo bearer.
- La visualización de fotografías exige una sesión del panel con acceso al caso y coincidencia exacta con sus adjuntos. Se añaden el identificador de caso al enlace interno, `no-store` y `nosniff`; se rechazan rutas arbitrarias y tipos que no sean imágenes permitidas.
- Se corrigieron errores de lint existentes: navegación interna con Link y un instante de referencia común a estadísticas y tabla de pedidos, obtenido al consultar los datos. Los informes de Playwright quedan excluidos de Git y ESLint.

## Verificaciones ejecutadas

| Comprobación | Resultado verificado | Alcance |
| --- | --- | --- |
| `npm run build` | Correcta, repetida tras las correcciones | Compilación de producción y tipos Next.js |
| `tsc --noEmit --incremental false` | Correcta | Proyecto completo |
| `npm run test:portal` | 27 superadas | Sesión, autorización, rutas reales del frontend, cuerpos, fotografías y errores simulados |
| `npm run test:portal:backend` | 3 superadas | Firmas y grants reales del backend, su guard y comprobaciones de pedido/cliente/tienda/empresa con Prisma simulado |
| `npm run test:exchanges` | 7 superadas | Variantes, bloqueo económico y endpoints de staging |
| `npm run test:browser` | 20 superadas | Diez escenarios en Chromium, escritorio y emulación Pixel 7 |
| `npm run lint` | 0 errores, 1 advertencia | La advertencia restante corresponde al img de fotografías protegidas del panel |
| Workflow YAML y `git diff --check` | Correctos | Configuración analizada localmente; sin ejecutar GitHub Actions |

Total: **57 pruebas superadas, sin omisiones ni fallos en las pasadas finales**. Las 144 pruebas anteriores del backend no se suman a este total ni se presentan como reejecutadas.

Playwright está instalado junto con Chromium. Se comprobaron enlaces sin credenciales y caducados, limpieza del fragmento, ausencia de persistencia, 401, pedido diferente, cantidades no disponibles, solicitud válida, borrador no recuperable, respuesta de creación perdida, continuación móvil, fotos obligatorias y QR. Se revisaron las capturas de escritorio y móvil y se comprobó que no hay desbordamiento horizontal. No se ha establecido todavía una comparación de píxeles contra capturas de referencia.

Las pruebas del navegador interceptan las API y bloquean peticiones a otros orígenes. El servidor temporal escucha en `127.0.0.1:3100`; backend y almacenamiento apuntan a un puerto local inactivo. Las pruebas de rutas y almacenamiento utilizan fetch simulado. No se usaron bases de datos ni cuentas de proveedores.

El workflow del frontend instala Chromium, ejecuta las pruebas existentes, el contrato local del portal y las pruebas del navegador, y conserva los informes como artefactos. Utiliza un token de repositorio de solo lectura y no introduce secretos. Las tres pruebas cruzadas requieren la compilación del repositorio backend vecino y se ejecutaron localmente; no se incluyen en el job que solo contiene el frontend.

Se corrigieron durante la validación los dos fallos iniciales de la prueba de QR, que intentaba abrir su sección sin seleccionar previamente un producto. También se apartaron, conservándolos, cuatro duplicados de tipos generados de Next.js que causaban declaraciones repetidas. La copia local está en `/private/tmp/novex-section10-next-types-backup/`; no se borró código fuente.

La configuración usa el servidor temporal documentado por [Playwright webServer](https://playwright.dev/docs/test-webserver) y la interceptación descrita en [Playwright Network](https://playwright.dev/docs/network).

## Archivos modificados o añadidos

Soporte y configuración:

- `lib/portal-authorization.ts` — conservado y completado.
- `lib/portal-route.ts` — conservado y completado.
- `app/return/PortalSession.tsx` y `app/return/layout.tsx` — conservados y completados.
- `lib/portal-photos.ts`.
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`.
- `playwright.config.ts`, `.github/workflows/exchanges-ui-ci.yml`.
- `AGENTS.md`: Next.js actualizó automáticamente el nivel del encabezado de su bloque generado; se conserva ese cambio.

Portal y fotografías:

- `app/api/public/returns/orders/[publicId]/route.ts`.
- `app/api/public/returns/orders/[publicId]/drafts/route.ts`.
- `app/api/public/returns/orders/[publicId]/cases/route.ts`.
- `app/api/public/returns/drafts/[token]/route.ts`.
- `app/api/public/returns/cases/[publicId]/route.ts`.
- `app/api/public/returns/shopify/order-link/route.ts`.
- `app/api/return-photos/route.ts`, `app/api/return-photos/view/route.ts`.
- `app/return/[id]/page.tsx`, `app/return/[id]/ReturnRequestForm.tsx`.
- `app/return/[id]/success/[caseId]/page.tsx`, `app/return/mobile/[token]/page.tsx`.
- `app/cases/[id]/page.tsx`, `app/orders/page.tsx`, `app/orders/OrdersTable.tsx`.

Pruebas y documentación:

- `tests/portal-authorization.test.mjs`, `tests/portal-routes.test.mjs`.
- `tests/portal-photos.test.mjs`, `tests/portal-backend-contract.test.mjs`.
- `tests/browser/portal.spec.ts`.
- Este informe.

## Pendientes y límites

1. Las **18 pruebas nativas de PostgreSQL** del backend siguen pendientes de ejecución en su servicio temporal de GitHub Actions. No se conectó con PostgreSQL ni se ejecutó ninguna migración en esta tarea.
2. No se ha ejecutado el workflow remoto: no se hizo commit ni push. El job de navegador está configurado y las mismas pruebas han pasado localmente.
3. Falta comprobar el recorrido completo desde una sesión real de cuenta de cliente de Shopify hasta la emisión y apertura del enlace en un entorno autorizado. Las pruebas de esta tarea usan firmas sintéticas y servicios simulados. El frontend no crea credenciales para pedidos de invitado ni amplía las plataformas autorizadas por el backend.
4. El grant dura lo establecido por el backend —actualmente quince minutos—. Un refresco completo o una nueva pestaña sin fragmento requiere reabrir el enlace autorizado; un borrador por sí solo no recupera la sesión. Los QR deben compartirse únicamente con la persona que gestiona ese pedido.
5. Almacenamiento y registro de fotografías son dos operaciones distintas. Un resultado desconocido puede dejar un objeto sin registrar; no se aplica borrado automático ni se reintenta una escritura de forma automática. La capacidad definitiva la controla el backend. La recogida de objetos huérfanos requiere un procedimiento posterior con evidencia del registro.
6. Firefox, WebKit y dispositivos físicos no se han ejecutado. La cobertura móvil es emulación de Chromium.
7. La correlación de Sendcloud y las operaciones económicas permanecen en el backend. Esta adaptación no habilita pagos ni etiquetas y no añade una vía de recuperación alternativa basada solo en un número de pedido. Los casos sin referencia verificable deben continuar bloqueados.

La parte de autorización del frontend queda comprobada localmente dentro de estos límites. El cierre completo de la Sección 10 sigue dependiendo de las comprobaciones nativas y del recorrido real autorizado entre aplicaciones. No se modificaron producción, archivos .env, credenciales ni bases existentes; no hubo operaciones económicas, commits, push ni despliegues.
