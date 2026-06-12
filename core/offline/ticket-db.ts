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

export const upsertTickets = (tickets: LocalTicket[]) => {
  if (!tickets.length) return;
  db.withTransactionSync(() => {
    for (const ticket of tickets) {
      db.runSync(
        `INSERT INTO tickets (qrCode, eventId, orderId, usageCount, maxUsages, customerName, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(qrCode) DO UPDATE SET
           usageCount = excluded.usageCount,
           maxUsages = excluded.maxUsages,
           customerName = excluded.customerName,
           updatedAt = excluded.updatedAt`,
        [
          ticket.qrCode,
          ticket.eventId,
          ticket.orderId,
          ticket.usageCount,
          ticket.maxUsages,
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
    db.runSync("DELETE FROM tickets");
    return;
  }
  const placeholders = eventIds.map(() => "?").join(",");
  db.runSync(
    `DELETE FROM tickets WHERE eventId NOT IN (${placeholders})`,
    eventIds,
  );
};
