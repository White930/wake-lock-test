class WakeLockManager {
  constructor(onStatusChange) {
    this.wakeLock = null;
    this.isActive = false;
    this.onStatusChange = onStatusChange;

    // 監聽是否有切換頁面
    document.addEventListener('visibilitychange', () => {
      if (this.isActive && document.visibilityState === 'visible') {
        this.logToScreen('🖱️ 切頁面重新發送請求');
        this.request();
      }
    });
  }

  // 檢查是否支援 Wake Lock API，並發送請求
  async request() {
    if (!('wakeLock' in navigator)) {
      this.logToScreen('🚫 Wake Lock API 不支援這個環境');
      return;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.isActive = true;
      if (this.onStatusChange) this.onStatusChange(true);
      this.logToScreen('✅ 螢幕防休眠已啟動');

      this.wakeLock.addEventListener('release', () => {
        if (this.onStatusChange) this.onStatusChange(false);
        this.logToScreen('⚠️ Wake Lock 被釋放');
      });
    } catch (err) {
      this.logToScreen('❌ Wake Lock 啟動失敗:', err.message);
    }
  }

  // 釋放 Wake Lock
  async release() {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
      this.isActive = false;
      if (this.onStatusChange) this.onStatusChange(false);
      this.logToScreen('❎ Wake Lock 手動解除');
    }
  }

  // 切換 Wake Lock 狀態
  toggle() {
    if (this.isActive) {
      this.release();
    } else {
      this.request();
    }
  }

  isLocked() {
    return this.isActive;
  }

  logToScreen(...args) {
    const logEl = document.getElementById('log');
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    if (logEl) logEl.textContent += msg + '\n';
    console.log(...args);
  }
}
