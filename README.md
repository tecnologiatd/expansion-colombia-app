# Expancol — app móvil

Aplicación Expo/React Native para eventos, compras y lectura de entradas. El checkout se abre en WordPress/WooCommerce y los pagos se procesan allí mediante Openpay.

## Estado y contexto para IA

Versión actual del workspace: **2.0.0**, alineada en [app.json](app.json) y [package.json](package.json). No hay confirmación de publicación de esta versión en tiendas.

La documentación consolidada está en [RESUMEN_ESTADO_ACTUAL.md](../expansion-colombia-backend/docs/RESUMEN_ESTADO_ACTUAL.md), dentro del repositorio hermano del backend. Si este repositorio se consulta por separado, obtener ese documento antes de inferir el estado productivo.

El usuario confirmó pagos productivos tarjeta/PSE y la migración Nest. Hay cambios locales adicionales en app/backend: revisar `git status` y verificar que las rutas requeridas estén desplegadas antes del release.

## Desarrollo

Usar Yarn 4.18.0. Completar una configuración privada desde [.env.example](.env.example), conservando archivos existentes.

```sh
corepack yarn install --immutable
corepack yarn start
```

Para iniciar plataformas nativas:

```sh
corepack yarn android
corepack yarn ios
```

Los scripts de pruebas están en `package.json`; ejecutarlos cuando la tarea solicite comprobaciones.

## Build y configuración

- SDK/dependencias vigentes: `package.json` y `yarn.lock`. La app usa Expo 57 y React Native 0.86.3.
- `runtimeVersion.policy=appVersion`. El salto de SDK y los módulos nativos requieren un nuevo binario; las OTA deben respetar el runtime del binario destino.
- En el `eas.json` actual, **preview y production apuntan a producción**. Preview es distribución interna, con Android arm64; production usa incremento automático de build remoto. Revisar perfil, canal y servidor antes de compilar.
- Bundle/package: `com.expansioncolombia`; retorno del pago: `expansioncolombia://order/{id}`.
- Las variables `EXPO_PUBLIC_*` son públicas en el binario: las credenciales Woo/Openpay y secretos JWT/HMAC pertenecen a los servicios.

## Sentry

- El DSN se lee directamente de `EXPO_PUBLIC_SENTRY_DSN`: no copiarlo a `app.json`.
- `app.config.js` toma `SENTRY_ORG` y `SENTRY_PROJECT` del entorno para el plugin Expo, manteniendo los valores de `app.json` como respaldo. El token nunca se incluye en la configuración pública.
- Expo carga el `.env` local. Para EAS remoto, configurar las cuatro variables del ejemplo en los entornos `preview` y `production`: DSN/organización/proyecto como texto público y `SENTRY_AUTH_TOKEN` como secreto. Los perfiles de `eas.json` seleccionan explícitamente su entorno. El `.env` ignorado por Git no se sube al builder.
- El 5 de octubre se configuraron las cuatro variables en **production** y, tras una autorización posterior del usuario, también en **preview**, manteniendo el token como secreto en ambos entornos. La presencia de variables no acredita recepción de eventos ni una publicación en tiendas.
- El SDK se habilita en builds sin `__DEV__` y con DSN. `EXPO_PUBLIC_SENTRY_ENVIRONMENT` separa incidencias de preview/production.
- Pedidos, recuperación/generación de QR, consulta de usos y sincronización offline reportan fallos inesperados. Las consultas reportan después de sus reintentos y una sola vez por consulta compartida; el mismo error no se reporta también desde checkout. Fallos equivalentes del mismo flujo/lugar se limitan a uno cada cinco minutos en cada instancia de app, sin impedir las solicitudes ni los reintentos.
- Se omiten cancelaciones, funcionamiento offline, mantenimiento y errores esperados de validación/autorización/conflicto/rate limit. Se envía operación, etapa de sync, código HTTP/código Axios y stack saneado, sin el objeto Axios, facturación, mensajes del servidor, ID del pedido ni QR. Se excluyen breadcrumbs de consola/navegación y se reducen las URLs HTTP a rutas genéricas.
- Antes de acreditar el monitoreo en producción, comprobar recepción de un evento controlado y source maps/símbolos de un build de prueba. No probar provocando cierres en la app de compradores. Para OTA, subir también los mapas del bundle actualizado; `SENTRY_AUTH_TOKEN` secreto de EAS no está disponible automáticamente en una ejecución local de EAS Update.

Referencias: [Expo/Sentry](https://docs.expo.dev/guides/using-sentry/) y [variables EAS](https://docs.expo.dev/eas/environment-variables/).

### Build Android local con Sentry

`eas build --platform android --local --profile preview` selecciona `preview`: obtiene las variables remotas de texto público/sensibles y aplica el backend/etiqueta Sentry del perfil. **Los secretos de EAS no se descargan para un build local.** Para que la subida de mapas/símbolos disponga del token existente en tu `.env`, iniciar EAS con el entorno local cargado (Node >=20.19):

```sh
node --env-file=.env "$(command -v eas)" build --platform android --local --profile preview
```

Ejecutar desde la raíz de la app. Este comando usa el `.env` local sin copiar el token a la configuración pública ni escribir su valor en el comando. Usa el CLI `eas` instalado en tu PATH; el build sigue apuntando al backend Railway fijado en el perfil preview. No crea ni actualiza variables remotas: esas se configuraron por separado. La activación/captura Sentry usa el DSN; el token privado se necesita durante el build para la subida de mapas/símbolos. Referencia: [limitaciones de builds locales](https://docs.expo.dev/build-reference/local-builds/).

Diagnóstico del 5 de octubre: el build Android preview 2.0.0+31 falló en la tarea de subida Sentry con HTTP 400 `One or more projects are invalid`. El entorno tenía `SENTRY_PROJECT=expancols`; el proyecto accesible es **`expancol`** en `atd-sas`. Se corrigió `.env` y la variable en EAS preview/production, conservando el token con alcance `org:ci`. La consulta de releases funciona con `expancol`. Se normalizó la URL del plugin a `https://sentry.io` para coincidir con la del token; el aviso sobre la barra final no era la causa del HTTP 400. Falta repetir el build y confirmar la subida de mapas/símbolos.

## Código

- `app/`: pantallas y rutas Expo Router; `(tabs)` compradores, `(admin)` lectores.
- `core/`: acciones/API, interfaces, stores y SQLite/sincronización offline. La API compartida está en `core/api/wordpress-api.ts`.
- `presentation/`: componentes, autenticación y hooks; las pantallas consumen esos hooks.
- `helpers/`: adaptadores/utilidades. Alias `@/*` apunta a la raíz; estilos con NativeWind.

Conservar el historial paginado, el contrato QR anterior, la cola SQLite y los reintentos del mismo pedido. El retorno del navegador no prueba que el pago esté confirmado.
