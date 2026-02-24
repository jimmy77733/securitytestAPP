/**
 * 同步建置共用邏輯：依序檢查並執行 npm install、必要時 pack:full，最後執行 npm run build。
 * 若專案目錄無 package.json（例如在執行檔環境），則回傳錯誤。
 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const EXE_NAME = '題庫平台.exe';
const BUILD_TIMEOUT_MS = 120000;
const INSTALL_TIMEOUT_MS = 300000;
const PACK_FULL_TIMEOUT_MS = 300000;

function runNpm(projectRoot, args, timeoutMs) {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const child = spawn(isWin ? 'npm.cmd' : 'npm', args, {
      cwd: projectRoot,
      shell: isWin,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr?.on('data', (d) => { stderr += d.toString(); });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, error: `逾時（超過 ${timeoutMs / 1000} 秒）` });
    }, timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve({ success: true });
      else resolve({ success: false, error: stderr.slice(-500) || `結束碼 ${code}` });
    });
  });
}

/**
 * @param {string} projectRoot - 專案根目錄（含 package.json）
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function runTriggerBuild(projectRoot) {
  const packageJsonPath = join(projectRoot, 'package.json');
  const nodeModulesPath = join(projectRoot, 'node_modules');
  const exePath = join(projectRoot, 'dist-portable', EXE_NAME);

  if (!existsSync(packageJsonPath)) {
    return {
      success: false,
      error: '目前環境無法執行同步建置（請在專案目錄以 npm run dev 或 npm run start:standalone 啟動）',
    };
  }

  if (!existsSync(nodeModulesPath)) {
    const installResult = await runNpm(projectRoot, ['install'], INSTALL_TIMEOUT_MS);
    if (!installResult.success) {
      return { success: false, error: `npm install 失敗：${installResult.error}` };
    }
  }

  if (!existsSync(exePath)) {
    const packResult = await runNpm(projectRoot, ['run', 'pack:full'], PACK_FULL_TIMEOUT_MS);
    if (!packResult.success) {
      return { success: false, error: `npm run pack:full 失敗：${packResult.error}` };
    }
    return { success: true };
  }

  const buildResult = await runNpm(projectRoot, ['run', 'build'], BUILD_TIMEOUT_MS);
  if (!buildResult.success) {
    return { success: false, error: buildResult.error };
  }
  return { success: true };
}
