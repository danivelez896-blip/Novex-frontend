# Sección 10 — auditoría final antes de GitHub (frontend)

Fecha: 17 de octubre de 2026. Rama: `feature/section-8-exchange-ui`.

Actualización posterior: el backend corrigió la evidencia de fotografías sin
cambiar el contrato HTTP del frontend. Véase
`../Novex/docs/section-10-photo-proof.md` desde la raíz de este repositorio y el
[informe de preparación de commits](section-10-github-preparation.md). Los
resultados y la ausencia de commits descritos en esta auditoría corresponden a su
ejecución original; el informe de preparación contiene la nueva verificación.

## Dictamen

**El frontend supera la validación funcional local y puede guardarse como trabajo de desarrollo con las salvedades documentadas. El cierre de seguridad sigue condicionado por los avisos de dependencias de desarrollo descritos más abajo y por la validación autorizada de la configuración real de almacenamiento. La brecha de evidencia de fotografías del backend se corrigió posteriormente con almacenamiento simulado.** En el momento de esta auditoría no se había creado ningún commit. **Un futuro push no está despejado hasta verificar las integraciones remotas de despliegue.**

## Revisión del árbol pendiente

Se revisaron los 34 archivos locales iniciales, tanto cambios versionados como archivos nuevos: las páginas y formularios del portal, las rutas públicas y de fotografías, la sesión en memoria, las utilidades de soporte, las pruebas, Playwright, dependencias, configuración e informe anterior. Se conservaron todas las funcionalidades y archivos previos. No se tocaron `.env`, credenciales ni ajustes de producción.

El escaneo heurístico de todos los archivos candidatos a publicar no encontró secretos reales. Las coincidencias eran fixtures sintéticos; las URLs públicas del ejemplo de staging no son credenciales. No se inspeccionaron valores de `.env.local`. No es un análisis del historial completo ni de la configuración de secretos remotos.

Las cachés `.next`, node_modules, informes/resultados Playwright, cobertura y archivos TypeScript generados permanecen excluidos de Git. `AGENTS.md` conserva el cambio de nivel del encabezado que genera Next; no modifica reglas funcionales y ya estaba cambiado al iniciar la auditoría. Se añadió `*.key` al ignore sin modificar ninguna clave.

## Contrato y seguridad

- El enlace firmado llega en el fragmento, se retira de la URL y se conserva solo en memoria. Cookies, localStorage y sessionStorage no almacenan grants. La caducidad, cambio de pedido y abandono del documento retiran el acceso; una respuesta 401 antigua no borra un grant nuevo.
- Pedido, borradores, guardado, fotos, creación del caso y confirmación envían bearer. Los identificadores públicos no conceden acceso. Los proxies conservan los estados del backend y responden sin caché ni referrer. Se mantienen límites de cuerpos, whitelist de rutas y timeout, sin reintentos ciegos de mutaciones.
- La emisión del enlace exige sesión de cliente Shopify en el backend. El contrato cruzado usa su firma y guard reales y datos simulados, con rechazos de firma, caducidad y ámbitos de pedido/cliente/tienda/empresa.
- El formulario crea un borrador incluso sin fotos, evita dos envíos simultáneos y recupera una respuesta de caso perdida consultando el mismo borrador. Un error de restauración no sobrescribe el contenido guardado.
- Las fotos exigen un borrador autorizado antes de la subida y registro. Se validan firma básica, MIME, nombre, tamaño y máximo de cinco; el backend vuelve a verificar el contexto bajo lock. Las fotografías del panel requieren acceso al caso y coincidencia exacta con el adjunto; las respuestas son privadas y llevan nosniff.

La prueba cruzada cubre rutas/guard/autorización con persistencia simulada; Playwright usa respuestas simuladas. No se presentan como una sesión Shopify real, un bucket real ni una operación económica.

## Correcciones de esta auditoría

1. `.github/workflows/exchanges-ui-ci.yml`: añadido lint y timeout de 20 minutos; conserva token de solo lectura, checkout sin credenciales persistentes, pruebas locales y Playwright con artefactos limitados a siete días. Los endpoints de CI y del servidor de pruebas apuntan a loopback inactivo; los fixtures del navegador bloquean otros orígenes y simulan las APIs.
2. `.gitignore`: exclusión adicional de claves `.key`.
3. Caché local: la primera compilación falló por declaraciones generadas duplicadas, por ejemplo `routes.d 2.ts`. Se conservaron los cuatro duplicados inicialmente detectados en `/private/tmp/novex-final-audit-duplicate-next-types`. Al detectar también copias en los tipos de producción, se conservó toda `.next` en `/private/tmp/novex-final-audit-next-cache-before-clean-build` y se recompiló desde cero. No se ocultaron errores mediante exclusiones de TypeScript ni se editaron fuentes para compensar la caché. Compilación, tipos y navegador pasaron después, incluidos los tipos tras Playwright.
4. Este informe y referencia desde el informe anterior para distinguir resultados históricos de la auditoría actual.

## Resultados reejecutados

Entorno: macOS, Node 24.20.0 y npm 11.19.0. No se suman pasadas intermedias.

| Comprobación | Resultado final |
| --- | --- |
| Compilación Next.js desde caché limpia | Correcta |
| TypeScript completo sin emisión/incremental | Correcto antes y después de Playwright |
| `test:portal` | **27 superadas**, 0 fallos/omisiones |
| `test:exchanges` | **7 superadas**, 0 fallos/omisiones |
| `test:portal:backend` contra backend recompilado con dependencias corregidas | **3 superadas**, 0 fallos/omisiones |
| Playwright Chromium escritorio y Pixel 7 emulado | **20 superadas**, 0 fallos/omisiones |
| ESLint completo | 0 errores, 1 advertencia por img de fotografías protegidas del panel |
| `npm audit --omit=dev` | **0 avisos de dependencias de ejecución** |
| `npm audit` completo | **5 avisos altos de desarrollo**, pendientes |
| Workflow YAML, lockfile y `git diff --check` | Correctos; CI remoto sin ejecutar |

Total de pruebas: **37 locales + 20 navegador = 57**. El backend se revalidó por separado: 158 locales y 23 PostgreSQL nativas aisladas, todas superadas. Las antiguas 18 pruebas PostgreSQL pendientes ya se ejecutaron y ampliaron; su prueba local está documentada en `../Novex/docs/section-10-pre-github-audit.md`.

Los logs de esta auditoría se conservan en `/private/tmp/novex-final-audit-frontend-*`, `novex-final-audit-contract-final.log`, `novex-final-audit-playwright-final.log` y `novex-final-audit-npm-frontend*.json`. No son archivos publicables.

## Dependencia pendiente

Los cinco avisos proceden de una cadena de desarrollo: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. El aviso [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) afecta a braces hasta 3.0.3 y no declara versión corregida. La consulta al registro npm confirmó 3.0.3 como latest en esta auditoría.

La sugerencia automática de npm es bajar `eslint-config-next` a 14.2.35, un cambio mayor respecto a Next 16. No se aplicó esa degradación ni se retiró lint para ocultar el aviso. Tampoco se introdujo un parche artesanal del parser sin validar. No se hallaron usos de braces/micromatch sobre entradas del cliente en las fuentes del portal; los patrones de lint son configuración local. Esto delimita la exposición y no elimina el aviso. Hace falta una corrección publicada/compatible, una sustitución validada de esa herramienta o una aceptación explícita y documentada del riesgo de desarrollo para cerrar esta parte de seguridad.

## GitHub Actions y despliegues

El workflow local solo instala, analiza, compila, prueba y sube artefactos de prueba. No contiene deploy, credenciales de plataformas ni llamadas a proveedores. Las tres pruebas cruzadas necesitan ambos repositorios y la compilación del backend; se ejecutaron localmente, pero no están automatizadas en el workflow de un checkout frontend aislado. GitHub Actions remoto en Linux/Node 22 y actionlint no se ejecutaron.

No hay CLI/conector autenticado de GitHub/Railway/Vercel ni navegador disponible para inspeccionar la configuración remota. **No puede descartarse un despliegue automático por push.** [Vercel despliega pushes de ramas por defecto en proyectos conectados](https://vercel.com/docs/git/vercel-for-github), y [Railway puede desplegar la rama conectada desde su integración](https://docs.railway.com/deployments/github-autodeploys), sin ningún comando deploy en los workflows.

Antes de autorizar publicación deben verificarse todos los proyectos conectados a ambos repositorios: repositorio/rama, production branch y entornos, autodeploy, previews, deploy hooks y GitHub Apps/webhooks. No se alteraron ajustes remotos ni se añadió configuración que modifique producción.

## Pendientes para cerrar la Sección 10

- Resolver o aceptar explícitamente los avisos de la herramienta de desarrollo, sin degradar Next ni ocultarlos.
- Confirmar las integraciones de despliegue antes de un push; después, ejecutar CI remoto autorizado.
- Recorrido autorizado real cuenta Shopify → enlace → portal, incluyendo caducidad y almacenamiento privado. **Brecha de evidencia de fotos corregida después de esta auditoría:** el backend verifica bucket privado, existencia, bytes, hash y ámbito de cada objeto al registrarlo y al consumir el borrador. Las pruebas utilizan almacenamiento simulado; sigue pendiente confirmar credenciales, políticas y retención en un entorno autorizado. No se añadieron campos obligatorios al contrato del frontend. Una subida parcialmente confirmada también puede dejar objetos huérfanos y requiere conciliación, sin borrados automáticos.
- Verificación efectiva de contratos Shopify/Sendcloud antes de activar operaciones económicas. Los casos Sendcloud sin referencia suficiente continúan bloqueados en el backend.

No hubo cambio de rama, commit, push, merge, despliegues, modificaciones de producción o credenciales, migraciones sobre bases existentes ni operaciones reales de proveedores.
