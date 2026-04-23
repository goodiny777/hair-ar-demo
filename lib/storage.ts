import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "hair-ar-demo";
const DB_VERSION = 1;
const STORE = "snapshots";

type SnapshotRecord = {
  id: string;
  createdAt: number;
  originalBlob: Blob;
  generatedBlob?: Blob;
  generatedUrl?: string;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveOriginal(id: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(STORE, {
    id,
    createdAt: Date.now(),
    originalBlob: blob,
  } satisfies SnapshotRecord);
}

export async function saveGenerated(
  id: string,
  generatedBlob: Blob,
  generatedUrl: string,
): Promise<void> {
  const db = await getDB();
  const existing = (await db.get(STORE, id)) as SnapshotRecord | undefined;
  if (!existing) throw new Error(`No snapshot ${id}`);
  await db.put(STORE, {
    ...existing,
    generatedBlob,
    generatedUrl,
  });
}

export async function getSnapshot(id: string): Promise<SnapshotRecord | undefined> {
  const db = await getDB();
  return (await db.get(STORE, id)) as SnapshotRecord | undefined;
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE);
}
