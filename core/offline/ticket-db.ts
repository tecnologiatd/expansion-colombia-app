// core/offline/ticket-db.ts
// Espejo local de tickets para el escaneo offline (dispositivo del admin) y
// cola de validaciones pendientes de sincronizar. SQLite en lugar de
// AsyncStorage: miles de tickets con búsqueda indexada por qrCode y escrituras
// transaccionales que no se pierden por un JSON parcial.
import { openDatabaseSync } from "expo-sqlite";

export interface LocalTicket {
  qrCode: string;
  eventId: string;
  orderId: string;
  usageCount: number;
  maxUsages: number;
  revoked?: boolean | number;
  customerName: string | null;
  updatedAt: string;
}

export interface PendingValidation {
  localId: string;
  qrCode: string;
  eventId: string;
  validatedAt: string;
}

const db = openDatabaseSync("tickets.db");

db.execSync(`
  CREATE TABLE IF NOT EXISTS tickets (
    qrCode TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    orderId TEXT NOT NULL,
    usageCount INTEGER NOT NULL DEFAULT 0,
    maxUsages INTEGER NOT NULL DEFAULT 1,
    revoked INTEGER NOT NULL DEFAULT 0,
    customerName TEXT,
    updatedAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(eventId);
  CREATE TABLE IF NOT EXISTS pending_validations (
    localId TEXT PRIMARY KEY,
    qrCode TEXT NOT NULL,
    eventId TEXT NOT NULL,
    validatedAt TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);
const ticketColumns = db.getAllSync<{ name: string }>(
  "PRAGMA table_info(tickets)",
);
if (!ticketColumns.some((column) => column.name === "revoked")) {
  db.execSync(
    "ALTER TABLE tickets ADD COLUMN revoked INTEGER NOT NULL DEFAULT 0",
  );
}

export const upsertTickets = (tickets: LocalTicket[]) => {
  if (!tickets.length) return;
  db.withTransactionSync(() => {
    for (const ticket of tickets) {
      db.runSync(
        `INSERT INTO tickets (qrCode, eventId, orderId, usageCount, maxUsages, revoked, customerName, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(qrCode) DO UPDATE SET
           usageCount = excluded.usageCount + (
             SELECT COUNT(*) FROM pending_validations WHERE qrCode = excluded.qrCode
           ),
           maxUsages = excluded.maxUsages,
           revoked = excluded.revoked,
           customerName = excluded.customerName,
           updatedAt = excluded.updatedAt`,
        [
          ticket.qrCode,
          ticket.eventId,
          ticket.orderId,
          ticket.usageCount,
          ticket.maxUsages,
          ticket.revoked ? 1 : 0,
          ticket.customerName,
          ticket.updatedAt,
        ],
      );
    }
  });
};

export const getTicketByQr = (qrCode: string): LocalTicket | null =>
  db.getFirstSync<LocalTicket>("SELECT * FROM tickets WHERE qrCode = ?", [
    qrCode,
  ]) ?? null;

// Incremento optimista tras una validación offline; el pull posterior
// corrige cualquier drift con los counts reales del servidor.
export const incrementLocalUsage = (qrCode: string) => {
  db.runSync(
    "UPDATE tickets SET usageCount = usageCount + 1 WHERE qrCode = ?",
    [qrCode],
  );
};

export const recordOfflineValidation = (
  validation: PendingValidation,
): LocalTicket => {
  let updated: LocalTicket | null = null;
  db.withTransactionSync(() => {
    const ticket = getTicketByQr(validation.qrCode);
    if (!ticket || ticket.eventId !== validation.eventId)
      throw new Error("Entrada no encontrada. Sincroniza el catálogo.");
    if (ticket.revoked) throw new Error("Entrada revocada.");
    if (ticket.usageCount >= ticket.maxUsages)
      throw new Error("Esta entrada ya se usó.");
    enqueueValidation(validation);
    incrementLocalUsage(validation.qrCode);
    updated = { ...ticket, usageCount: ticket.usageCount + 1 };
  });
  return updated!;
};

export const ensureScannerOwner = (username: string) => {
  const previous = getSyncMeta("scannerOwner");
  if (previous && previous !== username) {
    if (getPendingCount())
      throw new Error(
        "Hay escaneos pendientes del operador anterior. Inicia sesión con esa cuenta y sincroniza antes de cambiar.",
      );
    db.withTransactionSync(() => {
      db.runSync("DELETE FROM tickets");
      db.runSync("DELETE FROM sync_meta");
    });
  }
  setSyncMeta("scannerOwner", username);
};

export const clearScannerCatalog = () => {
  if (getPendingCount())
    throw new Error(
      "Sincroniza los escaneos pendientes antes de cerrar sesión.",
    );
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM tickets");
    db.runSync("DELETE FROM sync_meta");
  });
};

export const enqueueValidation = (validation: PendingValidation) => {
  db.runSync(
    `INSERT OR IGNORE INTO pending_validations (localId, qrCode, eventId, validatedAt, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [
      validation.localId,
      validation.qrCode,
      validation.eventId,
      validation.validatedAt,
      new Date().toISOString(),
    ],
  );
};

export const getPendingValidations = (): PendingValidation[] =>
  db.getAllSync<PendingValidation>(
    "SELECT localId, qrCode, eventId, validatedAt FROM pending_validations ORDER BY createdAt ASC",
  );

export const getPendingCount = (): number =>
  db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pending_validations",
  )?.count ?? 0;

export const hasPendingValidationFor = (qrCode: string): boolean =>
  (db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pending_validations WHERE qrCode = ?",
    [qrCode],
  )?.count ?? 0) > 0;

export const removePendingValidations = (localIds: string[]) => {
  if (!localIds.length) return;
  db.withTransactionSync(() => {
    for (const localId of localIds) {
      db.runSync("DELETE FROM pending_validations WHERE localId = ?", [
        localId,
      ]);
    }
  });
};

export const getSyncMeta = (key: string): string | null =>
  db.getFirstSync<{ value: string }>(
    "SELECT value FROM sync_meta WHERE key = ?",
    [key],
  )?.value ?? null;

export const setSyncMeta = (key: string, value: string) => {
  db.runSync(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
};

export const getLastSyncAt = () => getSyncMeta("lastSyncAt");
export const setLastSyncAt = (value: string) =>
  setSyncMeta("lastSyncAt", value);

// Limpia tickets (y su PII de nombre) de eventos que ya no están activos.
export const pruneEventsNotIn = (eventIds: string[]) => {
  if (!eventIds.length) {
    db.runSync(`DELETE FROM tickets WHERE NOT EXISTS (
      SELECT 1 FROM pending_validations WHERE qrCode = tickets.qrCode
    )`);
    return;
  }
  const placeholders = eventIds.map(() => "?").join(",");
  db.runSync(
    `DELETE FROM tickets WHERE eventId NOT IN (${placeholders}) AND NOT EXISTS (
      SELECT 1 FROM pending_validations WHERE qrCode = tickets.qrCode
    )`,
    eventIds,
  );
};
