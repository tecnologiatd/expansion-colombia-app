import { decode } from "html-entities";

// Precio en pesos colombianos: "$150.000". Woo puede entregar el precio como
// texto, y Intl/toLocaleString no agrupa igual en todos los dispositivos, así
// que los miles se separan a mano.
export const formatCOP = (value?: number | string | null): string => {
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount)) return "$0";
  const digits = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}$${digits}`;
};

// Texto plano a partir de HTML de WordPress: sin etiquetas y con las entidades
// (&amp;, &#127881;, …) convertidas, para que los emojis se vean bien.
export const plainText = (html?: string | null): string =>
  decode((html ?? "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
