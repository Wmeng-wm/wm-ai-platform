/**
 * Cloudflare Workers - 数据存储 API
 * 搭配医疗编织工艺知识库使用，提供免费云端数据同步
 *
 * 部署方法：
 * 1. 注册 https://dash.cloudflare.com（免费）
 * 2. 创建 Workers KV 命名空间，名称填 MEDICAL_BRAIDING_KV
 * 3. 创建 Worker，粘贴本文件
 * 4. 在 Worker 设置中绑定 KV 命名空间（变量名 MEDICAL_BRAIDING_KV）
 * 5. 部署，获得 https://你的worker名.workers.dev 地址
 * 6. 在知识库设置中填入该地址
 */

// 允许所有来源访问（CORS）
async function handleOptions(request) {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 读取数据
    if (request.method === 'GET' && url.pathname === '/api/data') {
        const data = await MEDICAL_BRAIDING_KV.get('backup_data', 'json');
        return new Response(JSON.stringify(data || {}), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 保存数据
    if (request.method === 'PUT' && url.pathname === '/api/data') {
        const body = await request.json();
        await MEDICAL_BRAIDING_KV.put('backup_data', JSON.stringify(body));
        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 健康检查
    if (request.method === 'GET' && url.pathname === '/api/ping') {
        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response('Not Found', { status: 404 });
}

addEventListener('fetch', event => {
    if (event.request.method === 'OPTIONS') {
        event.respondWith(handleOptions(event.request));
    } else {
        event.respondWith(handleRequest(event.request));
    }
});
