/**
 * AI 润色服务 - 支持 OpenAI 兼容接口 / Ollama
 */
const AIService = {
    _config: null,

    getConfig() {
        if (this._config) return this._config;
        try {
            const saved = localStorage.getItem('mbp_ai_config');
            this._config = saved ? JSON.parse(saved) : {
                endpoint: 'http://localhost:11434/v1/chat/completions',
                apiKey: '',
                model: 'qwen2.5'
            };
        } catch { this._config = { endpoint: '', apiKey: '', model: '' }; }
        return this._config;
    },

    saveConfig(config) {
        this._config = config;
        localStorage.setItem('mbp_ai_config', JSON.stringify(config));
    },

    async checkConnection() {
        const cfg = this.getConfig();
        if (!cfg.endpoint) throw new Error('请先配置 API 地址');
        const resp = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(cfg.apiKey ? { Authorization: 'Bearer ' + cfg.apiKey } : {})
            },
            body: JSON.stringify({
                model: cfg.model || 'qwen2.5',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 1
            })
        });
        if (!resp.ok) throw new Error('连接失败 (HTTP ' + resp.status + ')');
    },

    async polish(text, style) {
        if (!text.trim()) return '';
        const cfg = this.getConfig();
        if (!cfg.endpoint) throw new Error('err_need_config');

        const prompts = {
            workContent: '请将以下工作内容改写成正式、专业的医疗编织设备工作记录风格。保持全部技术细节，语句通顺，使用中文：\n\n',
            problem: '请将以下问题描述改写成正式、简洁的售后问题描述，使用中文：\n\n',
            process: '请将以下处理过程改写成规范的故障处理步骤，条理清晰、表述专业，使用中文：\n\n',
            result: '请将以下处理结果改写成正式、准确的售后结果说明，使用中文：\n\n'
        };

        const prompt = prompts[style] || prompts.workContent;

        const resp = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(cfg.apiKey ? { Authorization: 'Bearer ' + cfg.apiKey } : {})
            },
            body: JSON.stringify({
                model: cfg.model || 'qwen2.5',
                messages: [
                    { role: 'system', content: '你是一名专业的医疗编织设备工艺工程师，擅长将技术工作记录改写成正式、专业的文档风格。直接给出改写后的内容，不要加额外说明。' },
                    { role: 'user', content: prompt + text }
                ],
                temperature: 0.3,
                max_tokens: 2048
            })
        });

        if (!resp.ok) throw new Error('API 请求失败 (HTTP ' + resp.status + ')');

        const data = await resp.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        return result || text;
    }
};
