/**
 * 医疗编织工艺知识库 - 后端服务器
 * 提供：页面托管 + 数据存储 + WebDAV 代理
 *
 * 部署后，电脑和手机浏览器均可访问，数据实时同步
 *
 * 启动方法：node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'server-data.json');
const WEBDAV_HOST = 'dav.jianguoyun.com';
const WEBDAV_PORT = 443;

// ========== 数据文件读写 ==========

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    } catch (e) { console.error('loadData error:', e.message); }
    return {
        workRecords: [],
        serviceReports: [],
        parameters: [],
        knowledgeArticles: [],
        webdavConfig: { webdavUrl: '', webdavUser: '', webdavPass: '', autoSync: false }
    };
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ========== 请求解析 ==========

function getBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({}); }
        });
    });
}

function sendJSON(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Depth'
    });
    res.end(JSON.stringify(data));
}

// ========== 静态文件 MIME ==========

const MIME = {
    '.html': 'text/html;charset=utf-8',
    '.css': 'text/css;charset=utf-8',
    '.js': 'application/javascript;charset=utf-8',
    '.json': 'application/json;charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// ========== WebDAV 代理 ==========

function proxyWebDAV(req, res, parsed) {
    const targetPath = parsed.search || '';
    const options = {
        hostname: WEBDAV_HOST,
        port: WEBDAV_PORT,
        path: '/dav/' + (targetPath ? targetPath.substring(1) : ''),
        method: req.method,
        headers: { ...req.headers, host: WEBDAV_HOST }
    };
    delete options.headers['host'];

    // 转发 Authorization 头部（WebDAV 认证）
    const authHeader = req.headers['authorization'] || req.headers['x-webdav-authorization'];
    if (authHeader) options.headers['authorization'] = authHeader;

    const proxyReq = http.request(options, proxyRes => {
        const headers = {
            ...proxyRes.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, PROPFIND, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, Depth'
        };
        delete headers['transfer-encoding']; // 避免分块传输问题
        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
        sendJSON(res, 502, { error: 'WebDAV 代理连接失败: ' + err.message });
    });
    if (req.method !== 'OPTIONS') req.pipe(proxyReq);
    else proxyReq.end();
}

// ========== 服务器端 WebDAV 同步（由前端触发，服务器执行） ==========

async function serverSideWebDAVSync(data, config) {
    if (!config.webdavUrl) throw new Error('未配置 WebDAV 地址');

    const backupData = {
        workRecords: data.workRecords || [],
        serviceReports: data.serviceReports || [],
        parameters: data.parameters || [],
        knowledgeArticles: data.knowledgeArticles || [],
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    const json = JSON.stringify(backupData, null, 2);
    const filename = 'mbp_backup_' + new Date().toISOString().split('T')[0] + '.json';

    let wdUrl = config.webdavUrl;
    if (!wdUrl.endsWith('/')) wdUrl += '/';
    wdUrl += filename;

    const wdParsed = url.parse(wdUrl);
    const isHttps = wdParsed.protocol === 'https:';
    const mod = isHttps ? require('https') : http;

    const auth = config.webdavUser && config.webdavPass
        ? Buffer.from(config.webdavUser + ':' + config.webdavPass).toString('base64')
        : null;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: wdParsed.hostname,
            port: isHttps ? 443 : 80,
            path: wdParsed.path,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(json)
            }
        };
        if (auth) options.headers['Authorization'] = 'Basic ' + auth;

        const wdReq = mod.request(options, wdRes => {
            if (wdRes.statusCode >= 200 && wdRes.statusCode < 300) resolve(true);
            else reject(new Error('上传失败 (HTTP ' + wdRes.statusCode + ')'));
        });
        wdReq.on('error', reject);
        wdReq.write(json);
        wdReq.end();
    });
}

// ========== 路由处理 ==========

async function handleRequest(req, res) {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;

    // OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        sendJSON(res, 200, {});
        return;
    }

    // API 路由
    if (pathname === '/api/data') {
        const data = loadData();
        const key = parsed.query.key;

        if (req.method === 'GET') {
            if (key) {
                sendJSON(res, 200, data[key] || []);
            } else {
                sendJSON(res, 200, data);
            }
            return;
        }

        if (req.method === 'PUT') {
            const body = await getBody(req);
            if (key) {
                data[key] = body;
                saveData(data);
                sendJSON(res, 200, { ok: true });
            } else {
                Object.assign(data, body);
                saveData(data);
                sendJSON(res, 200, { ok: true });
            }

            // 如果启用了自动同步且有 WebDAV 配置，触发备份
            if (data.webdavConfig && data.webdavConfig.autoSync && data.webdavConfig.webdavUrl) {
                serverSideWebDAVSync(data, data.webdavConfig)
                    .catch(err => console.error('WebDAV auto sync failed:', err.message));
            }
            return;
        }

        sendJSON(res, 405, { error: 'Method not allowed' });
        return;
    }

    // WebDAV 配置读写
    if (pathname === '/api/webdav-config') {
        const data = loadData();

        if (req.method === 'GET') {
            const cfg = data.webdavConfig || { webdavUrl: '', webdavUser: '', webdavPass: '', autoSync: false };
            // 返回时去掉密码
            sendJSON(res, 200, { ...cfg, webdavPass: cfg.webdavPass ? '***' : '' });
            return;
        }

        if (req.method === 'PUT') {
            const body = await getBody(req);
            data.webdavConfig = body;
            saveData(data);
            sendJSON(res, 200, { ok: true });
            return;
        }

        sendJSON(res, 405, { error: 'Method not allowed' });
        return;
    }

    // 手动触发 WebDAV 同步（服务端执行）
    if (pathname === '/api/webdav/sync') {
        const data = loadData();
        const cfg = data.webdavConfig;
        if (!cfg || !cfg.webdavUrl) {
            sendJSON(res, 400, { error: '未配置 WebDAV' });
            return;
        }
        try {
            await serverSideWebDAVSync(data, cfg);
            sendJSON(res, 200, { ok: true });
        } catch (e) {
            sendJSON(res, 502, { error: e.message });
        }
        return;
    }

    // WebDAV 代理（供前端测试连接用）
    if (pathname === '/api/webdav') {
        proxyWebDAV(req, res, parsed);
        return;
    }

    // 导出备份
    if (pathname === '/api/export') {
        const data = loadData();
        const backup = {
            workRecords: data.workRecords || [],
            serviceReports: data.serviceReports || [],
            parameters: data.parameters || [],
            knowledgeArticles: data.knowledgeArticles || [],
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="backup.json"',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(backup, null, 2));
        return;
    }

    // 导入备份
    if (pathname === '/api/import' && req.method === 'PUT') {
        const body = await getBody(req);
        const data = loadData();
        if (body.workRecords) data.workRecords = body.workRecords;
        if (body.serviceReports) data.serviceReports = body.serviceReports;
        if (body.parameters) data.parameters = body.parameters;
        if (body.knowledgeArticles) data.knowledgeArticles = body.knowledgeArticles;
        saveData(data);
        sendJSON(res, 200, { ok: true });
        return;
    }

    // ========== 静态文件服务 ==========
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

    // 安全：防止路径穿越
    if (!filePath.startsWith(__dirname)) {
        sendJSON(res, 403, { error: 'Forbidden' });
        return;
    }

    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 如果文件不存在，返回 index.html（支持 SPA）
            if (pathname.startsWith('/js/') || pathname.startsWith('/css/')) {
                sendJSON(res, 404, { error: 'Not found' });
                return;
            }
            filePath = path.join(__dirname, 'index.html');
            fs.readFile(filePath, (e2, d2) => {
                if (e2) { sendJSON(res, 404, { error: 'Not found' }); return; }
                res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
                res.end(d2);
            });
        } else {
            res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
            res.end(data);
        }
    });
}

// ========== 启动服务器 ==========

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log('========================================');
    console.log('  医疗编织工艺知识库');
    console.log('========================================');
    console.log('  本地访问: http://localhost:' + PORT);
    console.log('');
    console.log('  手机访问（同一 WiFi）:');
    console.log('  http://' + getLocalIP() + ':' + PORT);
    console.log('');
    console.log('  功能：');
    console.log('  - 数据持久化存储（server-data.json）');
    console.log('  - 手机 + 电脑数据共享');
    console.log('  - WebDAV 自动备份到坚果云');
    console.log('  - 按 Ctrl+C 停止');
    console.log('========================================');
});

function getLocalIP() {
    const os = require('os');
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
        for (const iface of ifaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return '127.0.0.1';
}
