/**
 * 將 Windows exe 的 PE 子系統從 CONSOLE 改為 WINDOWS，使雙擊執行時不顯示主控台視窗。
 * 僅在 Windows 平台執行；其他平台略過。
 * 使用方式：node scripts/hide-console-subsystem.js [exe路徑]
 * 若 pkg 剛寫入 exe 後檔案仍被鎖定（EBUSY），會自動重試數次。
 */
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const isWin = process.platform === 'win32';
const exePath = process.argv[2] || join(process.cwd(), 'dist-portable', '題庫平台.exe');

if (!isWin) {
  console.log('Skip hide-console (non-Windows)');
  process.exit(0);
}

if (!existsSync(exePath)) {
  console.warn('Exe not found:', exePath);
  process.exit(1);
}

const IMAGE_SUBSYSTEM_WINDOWS_GUI = 2;
const IMAGE_SUBSYSTEM_WINDOWS_CUI = 3;
const EBUSY_RETRIES = 8;
const EBUSY_DELAY_MS = 600;

async function withRetry(fn) {
  for (let i = 0; i < EBUSY_RETRIES; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === 'EBUSY' && i < EBUSY_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, EBUSY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
}

(async () => {
  const buf = await withRetry(() => readFile(exePath));
  const eLfanew = buf.readUInt32LE(0x3c);
  if (buf.readUInt16LE(eLfanew) !== 0x4550) {
    console.warn('Invalid PE signature');
    process.exit(1);
  }
  const optionalHeaderOffset = eLfanew + 4 + 20;
  const magic = buf.readUInt16LE(optionalHeaderOffset);
  const subsystemOffset = optionalHeaderOffset + 68;
  const current = buf.readUInt16LE(subsystemOffset);
  if (current === IMAGE_SUBSYSTEM_WINDOWS_GUI) {
    console.log('Subsystem already Windows (no console)');
    process.exit(0);
  }
  if (current !== IMAGE_SUBSYSTEM_WINDOWS_CUI) {
    console.warn('Unexpected subsystem:', current);
    process.exit(1);
  }
  buf.writeUInt16LE(IMAGE_SUBSYSTEM_WINDOWS_GUI, subsystemOffset);
  await withRetry(() => writeFile(exePath, buf));
  console.log('Set exe subsystem to Windows (console hidden):', exePath);
})();
