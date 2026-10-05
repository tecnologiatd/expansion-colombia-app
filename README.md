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

## Código

- `app/`: pantallas y rutas Expo Router; `(tabs)` compradores, `(admin)` lectores.
- `core/`: acciones/API, interfaces, stores y SQLite/sincronización offline. La API compartida está en `core/api/wordpress-api.ts`.
- `presentation/`: componentes, autenticación y hooks; las pantallas consumen esos hooks.
- `helpers/`: adaptadores/utilidades. Alias `@/*` apunta a la raíz; estilos con NativeWind.

Conservar el historial paginado, el contrato QR anterior, la cola SQLite y los reintentos del mismo pedido. El retorno del navegador no prueba que el pago esté confirmado.
