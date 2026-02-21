import { create } from 'zustand';
import {
  getImportedImageIds,
  getImportedImageBlobUrl,
} from '@/utils/importedImagesStorage';

interface ImportedImagesState {
  /** 本機離線匯入的圖片 id -> blob URL */
  urls: Record<string, string>;
  /** 本機離線匯入的圖片 id 清單（供「有圖片」判斷用） */
  ids: string[];
  /** 是否已從 IndexedDB 載入過 */
  loaded: boolean;
  load: () => Promise<void>;
  /** 取得圖片 URL：優先本機離線，否則回傳伺服器路徑 */
  getUrl: (id: string) => string;
  /** 題組圖片用：id 可能含副檔名，需正規化 */
  getGroupImageUrl: (imageId: string) => string;
}

export const useImportedImagesStore = create<ImportedImagesState>((set, get) => ({
  urls: {},
  ids: [],
  loaded: false,

  load: async () => {
    const prev = get().urls;
    Object.values(prev).forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    });
    try {
      const ids = await getImportedImageIds();
      const urls: Record<string, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          const blobUrl = await getImportedImageBlobUrl(id);
          if (blobUrl) urls[id] = blobUrl;
        })
      );
      set({ urls, ids, loaded: true });
    } catch (e) {
      set({ urls: {}, ids: [], loaded: true });
    }
  },

  getUrl: (id: string) => {
    const { urls } = get();
    const key = id.replace(/\.(png|jpg|jpeg)$/i, '').trim();
    return urls[key] ?? `/question-images/${key}.png`;
  },

  getGroupImageUrl: (imageId: string) => {
    const { urls } = get();
    const base = (imageId || '').trim();
    const key = /\.(png|jpg|jpeg)$/i.test(base) ? base.replace(/\.(png|jpg|jpeg)$/i, '') : base;
    return urls[key] ?? (base.match(/\.(png|jpg|jpeg)$/i) ? `/question-images/${base}` : `/question-images/${base}.png`);
  },
}));
