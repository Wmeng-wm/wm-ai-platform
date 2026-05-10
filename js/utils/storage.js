/**
 * 本地存储工具 - 基于 localStorage + 服务器同步
 *
 * 通过 server.js 访问时：数据自动同步到服务器（手机/电脑数据互通）
 * 直接打开 HTML 或 GitHub Pages 时：仅 localStorage
 */
const Storage = {
    _prefix: 'mbp_',
    _useServer: false,
    _syncTimer: null,

    async init() {
        // 检测服务器模式，尝试从服务器加载数据到 localStorage
        try {
            const resp = await fetch('/api/data', { cache: 'no-store' });
            if (resp.ok) {
                const serverData = await resp.json();
                let hasData = false;
                ['workRecords', 'serviceReports', 'parameters', 'knowledgeArticles'].forEach(key => {
                    if (serverData[key] && serverData[key].length > 0) {
                        localStorage.setItem(this._key(key), JSON.stringify(serverData[key]));
                        hasData = true;
                    }
                });
                this._useServer = true;
                console.log('Storage: 服务器模式已启用' + (hasData ? '，已加载云端数据' : ''));
            }
        } catch {
            console.log('Storage: localStorage 模式');
        }
    },

    _key(key) {
        return 'mbp_' + key;
    },

    get(key) {
        try {
            const data = localStorage.getItem(this._key(key));
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    set(key, data) {
        try {
            localStorage.setItem(this._key(key), JSON.stringify(data));
            this._scheduleSync();
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this._key(key));
            return true;
        } catch { return false; }
    },

    getAll(collection) {
        return this.get(collection) || [];
    },

    getById(collection, id) {
        return this.getAll(collection).find(item => item.id === id) || null;
    },

    add(collection, item) {
        const items = this.getAll(collection);
        item.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        item.createdAt = new Date().toISOString();
        items.unshift(item);
        this.set(collection, items);
        return item;
    },

    update(collection, id, updates) {
        const items = this.getAll(collection);
        const idx = items.findIndex(item => item.id === id);
        if (idx === -1) return false;
        items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
        this.set(collection, items);
        return true;
    },

    delete(collection, id) {
        const items = this.getAll(collection);
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length === items.length) return false;
        this.set(collection, filtered);
        return true;
    },

    search(collection, query, fields) {
        if (!query) return this.getAll(collection);
        const q = query.toLowerCase();
        return this.getAll(collection).filter(item =>
            fields.some(f => String(item[f] || '').toLowerCase().includes(q))
        );
    },

    // ========== 服务器同步 ==========

    _scheduleSync() {
        if (!this._useServer) return;
        clearTimeout(this._syncTimer);
        this._syncTimer = setTimeout(() => this._syncToServer(), 300);
    },

    async _syncToServer() {
        const data = {
            workRecords: this.getAll('workRecords'),
            serviceReports: this.getAll('serviceReports'),
            parameters: this.getAll('parameters'),
            knowledgeArticles: this.getAll('knowledgeArticles')
        };
        try {
            await fetch('/api/data', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.warn('Storage sync failed:', e.message);
        }
    }
};
