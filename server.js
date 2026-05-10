/**
 * 本地服务器 + WebDAV 代理
 * 解决浏览器跨域问题，让 WebDAV 同步正常工作
 *
 * 使用方法：
 * 1. 安装 Node.js (https://nodejs.org)
 * 2. 在终端运行：node server.js
 * 3. 浏览器打开：http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置
const PORT = 3000;
const WEBDAV_HOST = 'dav.jianguoyun.com';
const WEBDAV_PORT = 443;

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

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url);

    // WebDAV 代理请求
    if (parsed.pathname === '/api/webdav') {
        const targetPath = parsed.search || '';
        const options = {
            hostname: WEBDAV_HOST,
            port: WEBDAV_PORT,
            path: '/dav/' + (targetPath ? targetPath.substring(1) : ''),
            method: req.method,
            headers: {
                ...req.headers,
                host: WEBDAV_HOST
            }
        };
        // 删除不需要的头部
        delete options.headers['host'];

        const proxyReq = http.request(options, proxyRes => {
            // 添加 CORS 头部（关键！让本地页面可以调用）
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, PROPFIND, OPTIONS',
                'Access-Control-Allow-Headers': 'Authorization, Content-Type, Depth'
            });
            proxyRes.pipe(res);
        });
        proxyReq.on('error', () => {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'WebDAV 代理连接失败，请检查网络' }));
        });
        if (req.method !== 'OPTIONS') req.pipe(proxyReq);
        else proxyReq.end();
        return;
    }

    // 静态文件服务
    let filePath = path.join(__dirname, parsed.pathname === '/' ? 'index.html' : parsed.pathname);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log('================================');
    console.log('  医疗编织工艺知识库 - 本地服务器');
    console.log('================================');
    console.log('  打开浏览器访问：');
    console.log('  http://localhost:' + PORT);
    console.log('');
    console.log('  功能：');
    console.log('  - 托管页面（无跨域问题）');
    console.log('  - WebDAV 同步正常工作');
    console.log('  - 关闭终端按 Ctrl+C');
    console.log('================================');
});
