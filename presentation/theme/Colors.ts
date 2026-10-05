/**
 * Tokens de color de la app (solo tema oscuro).
 * Mantener en sync con tailwind.config.js.
 */
export const Theme = {
  background: "#0F1422",
  surface: "#171D2E",
  surfaceRaised: "#222A42",
  line: "#2A3350",
  // Morado de botones y clases bg-brand / purple-500
  brand: "#A855F7",
  // Morado de íconos, indicadores de carga y pestaña activa
  accent: "#7B3DFF",
  text: "#F4F5F7",
  muted: "#9AA3B5",
  placeholder: "#6F7890",
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
} as const;

// Ancho máximo del contenido en tablets y pantallas anchas
export const CONTENT_MAX_WIDTH = 560;

const palette = {
  text: Theme.text,
  background: Theme.background,
  tint: Theme.accent,
  icon: Theme.muted,
  tabIconDefault: Theme.muted,
  tabIconSelected: Theme.text,
  primary: Theme.accent,
};

export const Colors = {
  light: palette,
  dark: palette,
};
