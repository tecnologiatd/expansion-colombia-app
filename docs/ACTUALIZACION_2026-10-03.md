# Actualización de la app — 3 de octubre de 2026

Guía coordinada de app, backend y WordPress: [GUIA_ACTUALIZACION_2026-10-03.md](../../expansion-colombia-backend/docs/GUIA_ACTUALIZACION_2026-10-03.md). El enlace funciona con ambos repositorios como carpetas hermanas del workspace Expancol; en una copia aislada consultar esa guía en el repositorio del backend.

La app se comparó desde `9d7994909e48416b43f778a485bdec7a36bad44b` hasta `12416c2`. El inventario completo de archivos/commits está en [INVENTARIO_CAMBIOS_2026-10-03.md](../../expansion-colombia-backend/docs/INVENTARIO_CAMBIOS_2026-10-03.md).

Implementado en el workspace, aún sin publicar:

- Sondeo de pagos `pending/on-hold`, reintento que reutiliza el pedido y clave de idempotencia persistida. El carrito se conserva al cerrar/cancelar el navegador; se limpia tras confirmación pagada del pedido correspondiente.
- Historial paginado de 20 compras, carga automática, reintento y protección contra páginas duplicadas. Puede recuperar más de 100 compras.
- Botón real de actualización y corrección de los diagnósticos TypeScript: `tsc --noEmit --incremental false` pasa.
- Cursor temporal común de sincronización offline, transacción SQLite para uso/cola y separación de operadores sin borrar validaciones pendientes.
- Backend conserva el contrato QR de la app anterior y los códigos/usos históricos de pedidos pagados.

Antes de publicar:

- Comprobar Android/iOS reales, 3DS/PSE y confirmaciones tardías.
- Aplicar la migración Nest, incluida `checkout_attempts`, y publicar auth v1.2 con `EXPANCOL_APP_JWT_SECRET` igual al secreto Nest existente antes del backend/app. Ver [PUBLICACION_EVENTO.md](../../expansion-colombia-backend/docs/PUBLICACION_EVENTO.md).
- Comprobar sincronización y revisar revocación de tickets históricos en el backend antes de usar lectores offline.
- Revisar [.env.example](../.env.example). `eas.json` actualmente dirige **preview y production a producción**; cambiar preview a staging antes del ensayo.
- Construir binarios nuevos: Expo 55 → 57 y nuevos módulos nativos no se entregan como OTA a los binarios anteriores. `app.json` usa versión/runtime 1.3 y mantiene `com.expansioncolombia`.
- Backend/plugin auth nuevos deben estar disponibles primero; conservar soporte legacy para clientes antiguos. Los pagos siguen en WooCommerce/Openpay; no incluir sus claves en Expo.

Esta revisión modificó la lógica de recuperación/estado de pagos, pero no publicó builds ni hizo cargos reales. Los pagos siguen ejecutándose en WooCommerce/Openpay. Falta comprobar los gateways en dispositivos y la capacidad de producción para el evento.

## Ajustes del 4 de octubre

- El catálogo offline se sincroniza desde el layout raíz para administradores y `shop_manager`, aunque no abran el escáner. Solo con sesión válida, conexión y app en primer plano. Una única operación compartida, descarga incremental cada cinco minutos y hasta diez segundos de dispersión entre dispositivos. Errores reintentan después de uno, dos, cuatro y como máximo cinco minutos. Se cancelan respuestas pendientes al salir de la sesión o pasar a segundo plano.
- La descarga conserva los usos de validaciones offline todavía pendientes y no elimina sus filas del catálogo al retirar eventos. Los lotes se suben antes de descargar cambios.
- Las imágenes ausentes, vacías o con espacios usan un recurso local. No se envía `source.uri=""` a los componentes de imagen.
- Un producto eliminado que Woo representa con ID cero muestra un aviso y no intenta generar nuevas entradas. La orden local 31198 era del producto de prueba eliminado 31031 y no tenía tickets; el usuario indicó dejarla intacta.
- Verificación: TypeScript sin diagnósticos, `test:offline` ocho pruebas y `test:payments` dos pruebas. Incluye SQLite real en memoria, exclusión de compradores/segundo plano, timer único, descarga compartida y cambio de sesión. No reemplaza QA nativo en dispositivos.
