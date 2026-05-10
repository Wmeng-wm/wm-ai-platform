/**
 * 数据备份服务 - 本地下载 / WebDAV 云端同步
 */
const BackupService = {
    _config: null,
    _changeCount: 0,
    _lastBackupTime: 0,
    _toastTimer: null,

    init() {
        this._config = this.getConfig();
        this.createToastContainer();
        this.monkeyPatchStorage();
        if (this._config.autoSync) this.startAutoBackup();
    },

    // ========== 配置 ==========

    getConfig() {
        if (this._config) return this._config;
        try {
            const saved = localStorage.getItem('mbp_backup_config');
            this._config = saved ? JSON.parse(saved) : {
                webdavUrl: '',
                webdavUser: '',
                webdavPass: '',
                autoSync: false,
                interval: 30 // 自动备份间隔（分钟）
            };
        } catch { this._config = { webdavUrl: '', webdavUser: '', webdavPass: '', autoSync: false, interval: 30 }; }
        return this._config;
    },

    saveConfig(config) {
        this._config = config;
        localStorage.setItem('mbp_backup_config', JSON.stringify(config));
        if (config.autoSync) {
            this.startAutoBackup();
        } else {
            this.stopAutoBackup();
        }
    },

    // ========== 数据收集 ==========

    getAllData() {
        return {
            workRecords: Storage.getAll('workRecords'),
            serviceReports: Storage.getAll('serviceReports'),
            parameters: Storage.getAll('parameters'),
            knowledgeArticles: Storage.getAll('knowledgeArticles'),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    },

    // ========== 本地下载备份 ==========

    async downloadBackup(showToastOnSuccess) {
        const data = this.getAllData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        // 优先使用 File System Access API
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: '编织平台数据备份_' + new Date().toISOString().split('T')[0] + '.json',
                    types: [{
                        description: 'JSON Backup',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(json);
                await writable.close();
                if (showToastOnSuccess !== false) this.showToast('备份已保存到本地', 'success');
                return true;
            } catch (err) {
                if (err.name === 'AbortError') return false;
                // 回退到传统下载
            }
        }

        // 传统下载方式
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '编织平台数据备份_' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (showToastOnSuccess !== false) this.showToast('备份已下载到本地', 'success');
        return true;
    },

    // ========== WebDAV 云端同步 ==========

    async syncToWebDAV() {
        const cfg = this.getConfig();
        if (!cfg.webdavUrl) throw new Error('未配置 WebDAV 地址');

        const data = this.getAllData();
        const json = JSON.stringify(data, null, 2);
        const filename = 'mbp_backup_' + new Date().toISOString().split('T')[0] + '.json';

        // 确保 WebDAV URL 以 / 结尾
        let url = cfg.webdavUrl;
        if (!url.endsWith('/')) url += '/';
        url += filename;

        const headers = { 'Content-Type': 'application/json' };
        if (cfg.webdavUser && cfg.webdavPass) {
            headers['Authorization'] = 'Basic ' + btoa(cfg.webdavUser + ':' + cfg.webdavPass);
        }

        const resp = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: json
        });

        if (!resp.ok) throw new Error('WebDAV 上传失败 (HTTP ' + resp.status + ')');
        this._lastBackupTime = Date.now();
        return true;
    },

    async testWebDAV() {
        const cfg = this.getConfig();
        if (!cfg.webdavUrl) throw new Error('未配置 WebDAV 地址');

        let url = cfg.webdavUrl;
        if (!url.endsWith('/')) url += '/';

        const headers = {};
        if (cfg.webdavUser && cfg.webdavPass) {
            headers['Authorization'] = 'Basic ' + btoa(cfg.webdavUser + ':' + cfg.webdavPass);
        }

        // PROPFIND 检测 WebDAV 是否可用
        const resp = await fetch(url, {
            method: 'PROPFIND',
            headers: { ...headers, Depth: '0' }
        });
        if (resp.status === 401) throw new Error('认证失败，请检查用户名和密码');
        if (!resp.ok) throw new Error('连接失败 (HTTP ' + resp.status + ')');
    },

    // ========== 自动备份 ==========

    startAutoBackup() {
        this.stopAutoBackup();
        const minutes = (this._config && this._config.interval) || 30;
        this._autoBackupTimer = setInterval(() => {
            this.syncToWebDAV()
                .then(() => this.showToast('云端自动备份成功', 'success'))
                .catch(err => console.warn('Auto backup failed:', err.message));
        }, minutes * 60 * 1000);
    },

    stopAutoBackup() {
        if (this._autoBackupTimer) {
            clearInterval(this._autoBackupTimer);
            this._autoBackupTimer = null;
        }
    },

    // ========== 变更跟踪 ==========

    monkeyPatchStorage() {
        const self = this;
        ['add', 'update', 'delete'].forEach(method => {
            const original = Storage[method];
            if (!original) return;
            Storage[method] = function () {
                const result = original.apply(this, arguments);
                self._changeCount++;
                self.onDataChanged();
                return result;
            };
        });
    },

    onDataChanged() {
        // 每变更 5 次提醒一次备份
        if (this._changeCount % 5 === 0) {
            const cfg = this.getConfig();
            if (cfg && cfg.autoSync && cfg.webdavUrl) {
                this.syncToWebDAV()
                    .catch(err => console.warn('Auto sync failed:', err.message));
            } else if (this._changeCount % 10 === 0) {
                this.showToast(
                    '已有 ' + this._changeCount + ' 条变更，建议备份数据',
                    'info'
                );
            }
        }
    },

    // ========== Toast 通知 ==========

    createToastContainer() {
        if (document.getElementById('backup-toast-container')) return;
        const div = document.createElement('div');
        div.id = 'backup-toast-container';
        div.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(div);
    },

    showToast(message, type) {
        const container = document.getElementById('backup-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = 'padding:10px 20px;border-radius:8px;font-size:13px;' +
            'box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:all 0.3s ease;' +
            'max-width:360px;word-break:break-word;' +
            (type === 'success'
                ? 'background:#065f46;color:#d1fae5;border:1px solid #059669;'
                : type === 'error'
                ? 'background:#7f1d1d;color:#fee2e2;border:1px solid #dc2626;'
                : 'background:#1e293b;color:#e2e8f0;border:1px solid #334155;');

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};
