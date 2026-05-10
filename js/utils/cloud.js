/**
 * 云端同步 - 通用 REST API 方案
 *
 * 支持 Cloudflare Workers KV（免费，国内访问快）
 * 也支持任何兼容的 REST API
 *
 * 使用方法（Cloudflare Workers）：
 * 1. 注册 https://dash.cloudflare.com（免费）
 * 2. 创建 Worker，部署 worker.js
 * 3. 获取 https://你的项目.workers.dev 地址
 * 4. 在知识库设置中填入该地址
 */
const CloudSync = {
    _config: null,
    _enabled: false,
    _syncTimer: null,
    _lastSyncTime: null,
    _lastSyncStatus: 'none', // 'none' | 'ok' | 'error'

    async init() {
        this._config = this.getConfig();
        if (this._enabled = this._checkEnabled()) {
            try {
                await this._loadFromCloud();
                console.log('CloudSync: 已启用，已加载云端数据');
            } catch (e) {
                console.warn('CloudSync: 首次加载失败，将在下次保存时创建云端数据', e.message);
            }
        }
    },

    _checkEnabled() {
        return this._config && this._config.enabled && !!this._config.apiUrl;
    },

    // ========== 配置 ==========

    getConfig() {
        try {
            const saved = localStorage.getItem('mbp_cloud_config');
            return saved ? JSON.parse(saved) : { apiUrl: '', token: '', enabled: false };
        } catch {
            return { apiUrl: '', token: '', enabled: false };
        }
    },

    saveConfig(config) {
        localStorage.setItem('mbp_cloud_config', JSON.stringify(config));
        this._config = config;
        const wasEnabled = this._enabled;
        this._enabled = this._checkEnabled();
        if (this._enabled && !wasEnabled) {
            this._loadFromCloud().catch(() => {});
        }
    },

    isEnabled() {
        return this._enabled;
    },

    // ========== 数据收集 ==========

    _getAllData() {
        return {
            workRecords: Storage.getAll('workRecords'),
            serviceReports: Storage.getAll('serviceReports'),
            parameters: Storage.getAll('parameters'),
            knowledgeArticles: Storage.getAll('knowledgeArticles')
        };
    },

    // ========== API 调用 ==========

    _baseUrl() {
        let url = this._config.apiUrl;
        if (url.endsWith('/')) url = url.slice(0, -1);
        return url;
    },

    _headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this._config.token) h['Authorization'] = 'Bearer ' + this._config.token;
        return h;
    },

    // 从云端加载数据到 localStorage
    async _loadFromCloud() {
        const resp = await fetch(this._baseUrl() + '/api/data', {
            headers: this._headers(),
            cache: 'no-store'
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);

        const data = await resp.json();
        let count = 0;
        if (data && typeof data === 'object') {
            ['workRecords', 'serviceReports', 'parameters', 'knowledgeArticles'].forEach(key => {
                if (data[key] && data[key].length > 0) {
                    Storage.set(key, data[key]);
                    count += data[key].length;
                }
            });
        }
        this._lastSyncTime = Date.now();
        this._lastSyncStatus = 'ok';
        return count;
    },

    // 上传数据到云端
    async _uploadToCloud() {
        if (!this._enabled) return;
        const data = this._getAllData();
        try {
            await fetch(this._baseUrl() + '/api/data', {
                method: 'PUT',
                headers: this._headers(),
                body: JSON.stringify(data)
            });
            this._lastSyncTime = Date.now();
            this._lastSyncStatus = 'ok';
        } catch (e) {
            this._lastSyncStatus = 'error';
            console.warn('CloudSync: 上传失败', e.message);
        }
    },

    // ========== 状态查询 ==========

    getStatus() {
        return {
            enabled: this._enabled,
            lastSyncTime: this._lastSyncTime,
            lastSyncStatus: this._lastSyncStatus,
            config: this._config ? { ...this._config, token: this._config.token ? '***' : '' } : null
        };
    },

    // ========== 对外接口 ==========

    // 每次数据变更后调用（自动去重 500ms）
    notifyChange() {
        if (!this._enabled) return;
        clearTimeout(this._syncTimer);
        this._syncTimer = setTimeout(() => this._uploadToCloud(), 500);
    },

    // 手动从云端拉取
    async pullFromCloud() {
        if (!this._enabled) throw new Error('云同步未配置');
        const count = await this._loadFromCloud();
        if (typeof App !== 'undefined' && App.updateStats) App.updateStats();
        return count;
    },

    // 手动上传到云端
    async pushToCloud() {
        if (!this._enabled) throw new Error('云同步未配置');
        await this._uploadToCloud();
    },

    // 测试连接
    async testConnection() {
        const resp = await fetch(this._baseUrl() + '/api/ping', {
            headers: this._headers()
        });
        if (!resp.ok) throw new Error('连接失败 (HTTP ' + resp.status + ')');
    }
};
