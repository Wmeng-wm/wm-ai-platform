/**
 * 本地存储工具 - 基于 localStorage 的 CRUD 操作
 */
const Storage = {
    _prefix: 'mbp_',

    _key(key) {
        return this._prefix + key;
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
    }
};
