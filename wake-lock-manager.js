class WakeLockManager {
  constructor(onStatusChange) {
    this.wakeLock = null;
    this.isActive = false;
    this.onStatusChange = onStatusChange;

    // iOS Safari 無法自動重新發請求，因此顯示提示畫面點擊
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      this.createIOSOverlay();
    }

    // 頁面載入完成後執行
    document.addEventListener('DOMContentLoaded', () => {
      wakeLockManager.request();
    });

    // 監聽是否有切換頁面
    document.addEventListener('visibilitychange', () => {
       if (this.isActive && document.visibilityState === 'visible') {
        this.logToScreen('🖱️ 切頁面重新發送請求');
        if (isIOS) 
          document.getElementById('iosOverlay').style.display = 'flex';
        else
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
      this.release();
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

  createIOSOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'iosOverlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.zIndex = '9999';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    overlay.style.color = 'white';
    overlay.style.fontSize = '1.2em';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.flexDirection = 'column';
    overlay.style.textAlign = 'center';
    overlay.innerHTML = `
      <div class="overlay-content" style="pointer-events: none;">
        <p>🔒 iOS 偵測到你切換回畫面</p>
        <p>請點擊畫面任意位置重新啟動防休眠</p>
      </div>
    `;
    document.body.appendChild(overlay);
  
    overlay.addEventListener('click', () => {
      wakeLockManager.request();
      overlay.style.display = 'none';
    });
  }

  logToScreen(...args) {
    const logEl = document.getElementById('log');
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    if (logEl) {
      logEl.textContent += msg + '\n';
      logEl.scrollTop = logEl.scrollHeight;
    }
    console.log(...args);
  }
}
