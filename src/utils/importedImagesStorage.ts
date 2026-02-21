/**
 * 離線匯入圖片：存於瀏覽器 IndexedDB，無需伺服器 API 即可匯入並顯示。
 */

const DB_NAME = 'QuestionImageStore';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * 儲存單張圖片（id = 檔名去掉副檔名）
 */
export async function saveImportedImage(id: string, arrayBuffer: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, data: arrayBuffer });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * 取得所有已儲存的圖片 id 清單
 */
export async function getImportedImageIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result as { id: string }[]).map((r) => r.id));
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/**
 * 取得單張圖片並轉成 Blob URL
 */
export async function getImportedImageBlobUrl(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      db.close();
      const row = req.result as { id: string; data: ArrayBuffer } | undefined;
      if (!row?.data) {
        resolve(null);
        return;
      }
      const blob = new Blob([row.data], { type: 'image/png' });
      resolve(URL.createObjectURL(blob));
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/**
 * 從檔名取得 id（去掉 .png / .jpg / .jpeg）
 */
export function filenameToId(name: string): string {
  return (name || '').replace(/\.(png|jpg|jpeg)$/i, '').trim();
}
