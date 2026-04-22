const DB_NAME = 'pos-offline';
const STORE_NAME = 'pending-sales';
const DB_VERSION = 1;

export type PendingSalePayload = {
  locationId: number;
  items: { productId: number; quantity: number }[];
  comboItems: { comboId: number; quantity: number }[];
  customerName: string;
  customerEmail: string | null;
  customerWhatsapp: string | null;
  paymentMethod: string;
  customerId?: number;
  loyaltyCustomerId?: number;
  loyaltyRewardId?: number;
};

export type PendingSale = {
  id: string;
  receiptNumber: string;
  createdAt: string;
  locationName: string;
  payload: PendingSalePayload;
  displayItems: {
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }[];
  total: string;
  status: 'pending' | 'failed';
  lastError?: string;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePendingSale(sale: PendingSale): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(sale);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSales(): Promise<PendingSale[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as PendingSale[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingSale(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function markSaleFailed(id: string, lastError: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const sale = req.result as PendingSale | undefined;
      if (sale) {
        store.put({ ...sale, status: 'failed', lastError });
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}
