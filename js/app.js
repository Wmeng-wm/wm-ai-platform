/**
 * 医疗编织工艺知识库 - 主应用入口
 */
(function () {
    'use strict';

    const App = {
        currentPage: 'home',

        init() {
            try { this.renderHome(); } catch (e) { console.error('renderHome:', e); }
            try { this.bindNavigation(); } catch (e) { console.error('bindNavigation:', e); }
            try { this.bindMobileMenu(); } catch (e) { console.error('bindMobileMenu:', e); }
            try { this.initModules(); } catch (e) { console.error('initModules:', e); }
            try { this.initAIConfig(); } catch (e) { console.error('initAIConfig:', e); }
            try { this.initBackup(); } catch (e) { console.error('initBackup:', e); }
            try { this.navigate('home'); } catch (e) { console.error('navigate:', e); }
        },

        renderHome() {
            const el = document.getElementById('page-home');
            el.innerHTML = `
              <div class="hero">
                <div class="hero-bg">
                  <div class="hero-grid"></div>
                  <div class="hero-glow"></div>
                </div>
                <div class="hero-content">
                  <div class="hero-badge">MEDICAL BRAIDING PLATFORM</div>
                  <h1 class="hero-title">医疗编织工艺知识库</h1>
                  <p class="hero-subtitle">集成工作记录 · 售后报告 · 参数管理 · 工艺知识的一站式平台</p>
                  <div class="hero-stats">
                    <div class="hero-stat"><span class="stat-num" id="stat-records">0</span><span class="stat-label">工作记录</span></div>
                    <div class="hero-stat"><span class="stat-num" id="stat-reports">0</span><span class="stat-label">售后报告</span></div>
                    <div class="hero-stat"><span class="stat-num" id="stat-params">0</span><span class="stat-label">工艺参数</span></div>
                    <div class="hero-stat"><span class="stat-num" id="stat-articles">0</span><span class="stat-label">知识文章</span></div>
                  </div>
                </div>
              </div>
              <div class="feature-grid">
                <div class="feature-card" data-page="work-record">
                  <div class="feature-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                  <h3>工作记录生成器</h3>
                  <p>填写工作信息，自动生成标准化工作记录，支持导出 Word / PDF</p>
                  <span class="feature-link">进入 <span class="feature-arrow">→</span></span>
                </div>
                <div class="feature-card" data-page="service-report">
                  <div class="feature-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>
                  <h3>售后报告生成器</h3>
                  <p>快速生成专业售后服务报告，记录完整的服务过程与结果</p>
                  <span class="feature-link">进入 <span class="feature-arrow">→</span></span>
                </div>
                <div class="feature-card" data-page="param-db">
                  <div class="feature-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></div>
                  <h3>参数数据库</h3>
                  <p>本地存储与搜索编织工艺参数，支持新增、编辑和删除</p>
                  <span class="feature-link">进入 <span class="feature-arrow">→</span></span>
                </div>
                <div class="feature-card" data-page="knowledge">
                  <div class="feature-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                  <h3>工艺知识库</h3>
                  <p>分类管理工艺文档，支持 Markdown 编辑与实时预览</p>
                  <span class="feature-link">进入 <span class="feature-arrow">→</span></span>
                </div>
              </div>
              <footer class="app-footer">
                <p>王萌编织工艺平台 v1.0 &copy; ${new Date().getFullYear()}</p>
              </footer>`;

            document.querySelectorAll('.feature-card').forEach(card => {
                card.addEventListener('click', () => {
                    const page = card.dataset.page;
                    if (page) this.navigate(page);
                });
            });
        },

        bindNavigation() {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    this.navigate(link.dataset.page);
                });
            });
        },

        bindMobileMenu() {
            const toggle = document.querySelector('.nav-toggle');
            const links = document.querySelector('.nav-links');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    links.classList.toggle('open');
                });
            }
        },

        navigate(page) {
            this.currentPage = page;
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.dataset.page === page);
            });
            document.querySelectorAll('.page').forEach(p => {
                p.classList.toggle('active', p.id === 'page-' + page);
            });
            document.querySelector('.nav-links')?.classList.remove('open');
            if (page === 'home') this.updateStats();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        updateStats() {
            document.getElementById('stat-records').textContent = Storage.getAll('workRecords').length;
            document.getElementById('stat-reports').textContent = Storage.getAll('serviceReports').length;
            document.getElementById('stat-params').textContent = Storage.getAll('parameters').length;
            document.getElementById('stat-articles').textContent = Storage.getAll('knowledgeArticles').length;
        },

        initModules() {
            WorkRecordModule.init();
            ServiceReportModule.init();
            ParamDBModule.init();
            KnowledgeBaseModule.init();
        },

        initBackup() {
            BackupService.init();
            this.bindBackup();
        },

        bindBackup() {
            const btn = document.getElementById('btn-backup');
            if (btn) {
                btn.addEventListener('click', () => BackupService.downloadBackup());
            }
        },

        // ========== AI 润色配置 ==========

        initAIConfig() {
            AIService.getConfig();
            this.renderAIConfigModal();
            this.bindAIConfig();
        },

        renderAIConfigModal() {
            const div = document.createElement('div');
            div.innerHTML = `
              <div class="modal-overlay" id="ai-config-modal">
                <div class="modal">
                  <div class="modal-header">
                    <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px;"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>系统设置</h3>
                    <button class="modal-close" id="ai-config-close">&times;</button>
                  </div>
                  <div class="modal-body">
                    <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">配置 AI 接口后，点击文本区域右下角的 <strong>润色</strong> 按钮即可自动改写润色内容。</p>
                    <div class="form-group" style="margin-bottom:14px;">
                      <label>API 地址 <span class="required">*</span></label>
                      <input type="text" id="ai-endpoint" placeholder="http://localhost:11434/v1/chat/completions">
                      <span class="form-hint">支持 OpenAI 兼容接口，如 Ollama、OpenAI、Azure 或中转 API</span>
                    </div>
                    <div class="form-group" style="margin-bottom:14px;">
                      <label>API Key <span style="color:var(--text-muted);font-weight:400;">（可选）</span></label>
                      <input type="password" id="ai-key" placeholder="sk-...">
                    </div>
                    <div class="form-group" style="margin-bottom:4px;">
                      <label>模型名称 <span class="required">*</span></label>
                      <input type="text" id="ai-model" placeholder="qwen2.5 / gpt-4o-mini / deepseek-chat">
                      <span class="form-hint">Ollama 默认 qwen2.5，OpenAI 默认 gpt-4o-mini</span>
                    </div>
                    <div class="settings-divider"></div>
                    <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text);">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>数据管理
                    </h4>
                    <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px;">导出所有数据为 JSON 文件备份，或导入之前备份的文件恢复数据。</p>
                    <div class="btn-group">
                      <button class="btn btn-success btn-sm" id="data-export-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导出数据</button>
                      <button class="btn btn-info btn-sm" id="data-import-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> 导入数据</button>
                    </div>
                    <input type="file" id="data-import-file" accept=".json" style="display:none;">
                    <div class="settings-divider"></div>
                    <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text);">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px;"><path d="M21 16v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="12" cy="16" r="4"/><path d="M12 8V2"/><polyline points="8 5 12 2 16 5"/></svg>云端同步
                    </h4>
                    <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px;">配置 WebDAV 后可自动备份数据到云端（如 Nextcloud、群晖等）。</p>
                    <div class="form-group" style="margin-bottom:14px;">
                      <label>WebDAV 地址 <span class="required">*</span></label>
                      <input type="text" id="webdav-url" placeholder="https://example.com/remote.php/dav/files/user/">
                    </div>
                    <div class="form-row">
                      <div class="form-group flex-1"><label>用户名</label><input type="text" id="webdav-user" placeholder="username"></div>
                      <div class="form-group flex-1"><label>密码</label><input type="password" id="webdav-pass" placeholder="password"></div>
                    </div>
                    <div class="form-row" style="align-items:center;gap:16px;">
                      <label class="checkbox-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
                        <input type="checkbox" id="webdav-auto-sync" style="width:16px;height:16px;accent-color:var(--accent);"> 自动同步（每30分钟）
                      </label>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-info" id="ai-config-test"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> 测试 AI</button>
                    <button class="btn btn-info" id="webdav-test-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="12" cy="16" r="4"/><path d="M12 8V2"/><polyline points="8 5 12 2 16 5"/></svg> 测试 WebDAV</button>
                    <button class="btn btn-primary" id="ai-config-save">保存配置</button>
                    <button class="btn btn-ghost" id="ai-config-cancel">取消</button>
                  </div>
                </div>
              </div>`;
            document.body.appendChild(div.firstElementChild);
        },

        bindAIConfig() {
            const btn = document.getElementById('btn-ai-settings');
            if (!btn) {
                console.warn('btn-ai-settings not found in DOM');
                return;
            }
            console.log('AI config initialized');

            btn.addEventListener('click', async () => {
                const cfg = AIService.getConfig();
                const bcfg = await BackupService.getConfig();
                try {
                    document.getElementById('ai-endpoint').value = cfg.endpoint || '';
                    document.getElementById('ai-key').value = cfg.apiKey || '';
                    document.getElementById('ai-model').value = cfg.model || 'qwen2.5';
                    document.getElementById('webdav-url').value = bcfg.webdavUrl || '';
                    document.getElementById('webdav-user').value = bcfg.webdavUser || '';
                    document.getElementById('webdav-pass').value = bcfg.webdavPass || '';
                    document.getElementById('webdav-auto-sync').checked = bcfg.autoSync || false;
                    document.getElementById('ai-config-modal').classList.add('active');
                } catch (e) {
                    console.error('AI config modal error:', e);
                    alert('配置弹窗加载失败：' + e.message);
                }
            });

            document.getElementById('ai-config-close').addEventListener('click', () => this.closeAIConfig());
            document.getElementById('ai-config-cancel').addEventListener('click', () => this.closeAIConfig());
            document.getElementById('ai-config-save').addEventListener('click', () => this.saveAIConfig());
            document.getElementById('ai-config-test').addEventListener('click', () => this.testAIConnection());
            document.getElementById('webdav-test-btn').addEventListener('click', () => this.testWebDAV());
            document.getElementById('ai-config-modal').addEventListener('click', e => {
                if (e.target === e.currentTarget) this.closeAIConfig();
            });

            // 数据导入/导出
            document.getElementById('data-export-btn').addEventListener('click', () => this.exportAllData());
            document.getElementById('data-import-btn').addEventListener('click', () => document.getElementById('data-import-file').click());
            document.getElementById('data-import-file').addEventListener('change', e => this.importAllData(e));
        },

        closeAIConfig() {
            document.getElementById('ai-config-modal').classList.remove('active');
        },

        async saveAIConfig() {
            const endpoint = document.getElementById('ai-endpoint').value.trim();
            if (!endpoint) { alert('请输入 API 地址'); return; }
            AIService.saveConfig({
                endpoint: endpoint,
                apiKey: document.getElementById('ai-key').value.trim(),
                model: document.getElementById('ai-model').value.trim() || 'qwen2.5'
            });
            // 保存 WebDAV 配置
            await BackupService.saveConfig({
                webdavUrl: document.getElementById('webdav-url').value.trim(),
                webdavUser: document.getElementById('webdav-user').value.trim(),
                webdavPass: document.getElementById('webdav-pass').value.trim(),
                autoSync: document.getElementById('webdav-auto-sync').checked,
                interval: 30
            });
            this.closeAIConfig();
            alert('配置已保存');
        },

        async testAIConnection() {
            const cfg = {
                endpoint: document.getElementById('ai-endpoint').value.trim(),
                apiKey: document.getElementById('ai-key').value.trim(),
                model: document.getElementById('ai-model').value.trim() || 'qwen2.5'
            };
            if (!cfg.endpoint) { alert('请输入 API 地址'); return; }

            AIService.saveConfig(cfg);
            const btn = document.getElementById('ai-config-test');
            btn.disabled = true;
            btn.innerHTML = '测试中…';

            try {
                await AIService.checkConnection();
                alert('连接成功！AI 润色功能已可用。');
            } catch (err) {
                alert('连接失败：' + err.message + '\n\n请检查 API 地址是否正确，以及服务是否已启动。');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> 测试连接';
            }
        },

        async testWebDAV() {
            const cfg = {
                webdavUrl: document.getElementById('webdav-url').value.trim(),
                webdavUser: document.getElementById('webdav-user').value.trim(),
                webdavPass: document.getElementById('webdav-pass').value.trim(),
                autoSync: document.getElementById('webdav-auto-sync').checked,
                interval: 30
            };
            if (!cfg.webdavUrl) { alert('请输入 WebDAV 地址'); return; }

            await BackupService.saveConfig(cfg);
            const btn = document.getElementById('webdav-test-btn');
            btn.disabled = true;
            btn.innerHTML = '测试中…';

            try {
                await BackupService.testWebDAV();
                alert('WebDAV 连接成功！');
            } catch (err) {
                alert('WebDAV 连接失败：' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="12" cy="16" r="4"/><path d="M12 8V2"/><polyline points="8 5 12 2 16 5"/></svg> 测试 WebDAV';
            }
        },

        // ========== 数据导入/导出 ==========

        exportAllData() {
            const data = {
                workRecords: Storage.getAll('workRecords'),
                serviceReports: Storage.getAll('serviceReports'),
                parameters: Storage.getAll('parameters'),
                knowledgeArticles: Storage.getAll('knowledgeArticles'),
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '编织平台数据备份_' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        importAllData(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.workRecords || !data.serviceReports || !data.parameters || !data.knowledgeArticles) {
                        alert('无效的数据文件，缺少必要的数据字段');
                        return;
                    }
                    const mode = confirm('点击"确定"合并导入（保留现有数据）\n点击"取消"替换导入（覆盖所有数据）');
                    if (mode) {
                        // 合并
                        const merge = (key) => {
                            const existing = Storage.getAll(key);
                            const incoming = data[key] || [];
                            Storage.set(key, [...incoming, ...existing]);
                        };
                        merge('workRecords');
                        merge('serviceReports');
                        merge('parameters');
                        merge('knowledgeArticles');
                        alert('数据合并导入成功！\n导入 ' +
                            data.workRecords.length + ' 条工作记录、' +
                            data.serviceReports.length + ' 条售后报告、' +
                            data.parameters.length + ' 条参数、' +
                            data.knowledgeArticles.length + ' 篇文章');
                    } else {
                        // 替换
                        Storage.set('workRecords', data.workRecords || []);
                        Storage.set('serviceReports', data.serviceReports || []);
                        Storage.set('parameters', data.parameters || []);
                        Storage.set('knowledgeArticles', data.knowledgeArticles || []);
                        alert('数据替换导入成功！共导入 ' +
                            (data.workRecords.length + data.serviceReports.length + data.parameters.length + data.knowledgeArticles.length) + ' 条记录');
                    }
                    this.updateStats();
                } catch (err) {
                    alert('数据文件解析失败：' + err.message);
                }
            };
            reader.readAsText(file, 'UTF-8');
            e.target.value = '';
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            Storage.init().then(() => App.init());
        });
    } else {
        Storage.init().then(() => App.init());
    }
})();
