
## Configuración de la App Móvil (React Native con Expo)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tuorganizacion/expansion-colombia-app.git
cd expansion-colombia-app

# Instalar dependencias
yarn install
```

### Configuración

1. Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

2. Edita el archivo `.env`:

```
EXPO_PUBLIC_BACKEND_URL=http://tu-backend-nestjs.com
```

### Ejecución en desarrollo

```bash
# Iniciar servidor de desarrollo
yarn start

# Ejecutar en iOS (requiere macOS)
yarn ios

# Ejecutar en Android
yarn android
```

## Compilación produccion
- https://docs.expo.dev/build-reference/local-builds/
- https://docs.expo.dev/build/setup/
- https://docs.expo.dev/submit/introduction/

## Estructura de carpetas de la App Móvil

El proyecto de la aplicación móvil utiliza Expo Router y está organizado siguiendo una arquitectura basada en características:

```
expansion-colombia-app/
├── app/                           # Rutas y pantallas de la aplicación (Expo Router)
│   ├── (admin)/                   # Área administrativa (validación de tickets)
│   │   ├── ticket/                # Pantallas de tickets
│   │   ├── _layout.tsx            # Layout para el área admin
│   │   └── scan.tsx               # Pantalla de escaneo de QR
│   ├── (tabs)/                    # Pestañas principales de la app
│   │   ├── _layout.tsx            # Configuración del TabBar
│   │   ├── blog.tsx               # Pestaña de blog
│   │   ├── cart.tsx               # Pestaña de carrito
│   │   ├── home.tsx               # Pestaña de inicio (eventos)
│   │   └── profile.tsx            # Pestaña de perfil
│   ├── auth/                      # Rutas de autenticación
│   │   ├── _layout.tsx            # Layout para autenticación
│   │   ├── forgot-password.tsx    # Pantalla de recuperación
│   │   ├── login.tsx              # Pantalla de inicio de sesión
│   │   └── register.tsx           # Pantalla de registro
│   ├── blog/                      # Detalles de posts del blog
│   ├── checkout/                  # Proceso de checkout
│   │   ├── billing.tsx            # Datos de facturación
│   │   └── payment.tsx            # Pantalla de pago
│   ├── event/                     # Detalles de eventos
│   ├── order/                     # Detalles de órdenes/pedidos
│   ├── _layout.tsx                # Layout principal de la app
│   ├── global.css                 # Estilos globales (TailwindCSS)
│   └── index.tsx                  # Punto de entrada (redirección)
├── core/                          # Núcleo de la aplicación
│   ├── actions/                   # Acciones de API (integración con backend)
│   ├── api/                       # Configuración de API
│   ├── auth/                      # Funcionalidades de autenticación
│   ├── interfaces/                # Interfaces TypeScript
│   ├── stores/                    # Almacenamiento de estado (Zustand)
│   └── validations/               # Validaciones (Zod)
├── helpers/                       # Utilidades y helpers
│   ├── adapters/                  # Adaptadores para servicios
│   └── removeHtml.ts              # Utilidad para limpiar HTML
├── presentation/                  # Capa de presentación
│   ├── auth/                      # Componentes de autenticación
│   ├── components/                # Componentes reutilizables
│   ├── hooks/                     # Hooks personalizados
│   ├── theme/                     # Configuración de temas
│   └── utils/                     # Utilidades específicas
├── .env.example                   # Plantilla de variables de entorno
├── app.json                       # Configuración de Expo
├── babel.config.js                # Configuración de Babel
├── eas.json                       # Configuración de Expo Application Services
├── package.json                   # Dependencias del proyecto
└── tailwind.config.js             # Configuración de TailwindCSS
```

### Archivos importantes de la App Móvil

- **app/_layout.tsx**: Configuración general de la aplicación, incluyendo navegación y autenticación.
- **app.json**: Configuración de Expo, incluyendo nombre de la app, versión, permisos, etc.
- **eas.json**: Configuración para builds y actualizaciones con Expo Application Services.
- **tailwind.config.js**: Configuración de TailwindCSS para estilos.
- **package.json**: Dependencias y scripts del proyecto.
- **babel.config.js**: Configuración de Babel para compilación.
- **tsconfig.json**: Configuración de TypeScript.

## Patrones de Arquitectura

### Backend (NestJS)

El backend implementa una arquitectura modular siguiendo los principios de NestJS:

1. **Controladores (Controllers)**: Manejan las solicitudes HTTP y devuelven respuestas.
2. **Servicios (Services)**: Contienen la lógica de negocio y se comunican con WordPress/WooCommerce.
3. **DTOs (Data Transfer Objects)**: Definen la estructura de los datos para validación y transferencia.
4. **Entidades (Entities)**: Representan las tablas de la base de datos.
5. **Guardias (Guards)**: Protegen rutas basadas en la autenticación y roles.
6. **Interceptores (Interceptors)**: Transforman la respuesta o solicitud.

### Aplicación Móvil (React Native + Expo)

La aplicación implementa una arquitectura basada en características con separación clara de responsabilidades:

1. **Acciones (Actions)**: Manejan la comunicación con el backend.
2. **Interfaces**: Definen los tipos de datos en TypeScript.
3. **Stores**: Gestionan el estado global de la aplicación usando Zustand.
4. **Hooks**: Encapsulan la lógica de negocio y estado reutilizable.
5. **Componentes**: Unidades visuales reutilizables.
6. **Pantallas (Screens)**: Componentes de nivel superior que representan pantallas completas.
7. **Layout**: Componentes que definen la estructura general de la navegación.

Esta arquitectura permite un desarrollo modular donde cada parte del sistema tiene una responsabilidad clara y específica, facilitando el mantenimiento y las extensiones futuras.