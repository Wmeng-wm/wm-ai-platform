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
            workContent: '请将以下工作内容润色为正式的工作记录。保留技术细节，语言自然通顺，直接输出结果：\n\n',
            problem: '请将以下问题描述润色为正式的售后报告。保留事实，简洁清晰，直接输出结果：\n\n',
            process: '请将以下处理过程润色为规范的维修记录。步骤清晰，语言简洁，直接输出结果：\n\n',
            result: '请将以下处理结果润色为正式的结案说明。结论明确，语言自然，直接输出结果：\n\n'
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
                    { role: 'system', content: '你是医疗编织设备工程师，将工作草稿润色为正式记录。语言自然、保留细节、不加额外说明。' },
                    { role: 'user', content: prompt + text }
                ],
                temperature: 0.8,
                max_tokens: 2048
            })
        });

        if (!resp.ok) throw new Error('API 请求失败 (HTTP ' + resp.status + ')');

        const data = await resp.json();
        const result = data.choices?.[0]?.message?.content?.trim();
        return result || text;
    }
};
