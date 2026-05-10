/**
 * 工艺知识库 - 支持分类、Markdown 编辑预览，导入 .md/.txt/.docx
 */
const KnowledgeBaseModule = {
    currentCategory: '全部',
    currentSearch: '',
    editingId: null,
    categories: ['全部', '编织工艺', '设备调试', '材料知识', '故障排除', '工艺规范', '其他'],

    init() {
        try {
            this.render();
            this.bindEvents();
            this.renderArticles();
        } catch (e) { console.error('KB init error:', e); }
    },

    render() {
        const el = document.getElementById('page-knowledge');
        el.innerHTML = `
          <div class="module-header">
            <h2><span class="module-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>工艺知识库</h2>
            <p class="module-desc">分类管理工艺文档，支持 Markdown 编辑与预览，支持导入 .md / .txt / .docx 文件</p>
          </div>
          <div class="kb-layout">
            <aside class="kb-sidebar">
              <h3 class="panel-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> 分类</h3>
              <div class="kb-category-list" id="kb-categories"></div>
            </aside>
            <div class="kb-main">
              <div class="toolbar">
                <div class="search-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" id="kb-search" placeholder="搜索文章标题...">
                </div>
                <div class="btn-group">
                  <button class="btn btn-primary" id="kb-add-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 新建文章</button>
                  <button class="btn btn-info" id="kb-import-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导入</button>
                </div>
                <input type="file" id="kb-file-input" accept=".md,.txt,.docx,.pdf" style="display:none;">
              </div>
              <div class="kb-article-list" id="kb-article-list"></div>
            </div>
          </div>
          <!-- Article Modal -->
          <div class="modal-overlay" id="kb-modal">
            <div class="modal modal-lg">
              <div class="modal-header">
                <h3 id="kb-modal-title">新建文章</h3>
                <button class="modal-close" id="kb-modal-close">&times;</button>
              </div>
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group flex-1"><label>标题 <span class="required">*</span></label><input type="text" id="kb-title" placeholder="请输入文章标题"></div>
                  <div class="form-group" style="flex:0 0 180px;"><label>分类 <span class="required">*</span></label>
                    <select id="kb-category"></select>
                  </div>
                </div>
                <div class="kb-editor-layout">
                  <div class="kb-editor-pane">
                    <label>内容 (Markdown)</label>
                    <div class="textarea-ai-wrapper">
                      <textarea id="kb-content" rows="16" placeholder="支持 Markdown 格式：&#10;# 标题&#10;## 子标题&#10;**粗体** *斜体*&#10;- 列表项&#10;1. 编号列表&#10;前后各三个反引号包裹代码块"></textarea>
                      <button class="btn-ai-polish" data-target="kb-content" data-style="workContent" title="AI 润色">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>
                        润色
                      </button>
                    </div>
                  </div>
                  <div class="kb-preview-pane">
                    <label>预览</label>
                    <div class="kb-preview-content markdown-body" id="kb-preview"></div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-primary" id="kb-save">保存</button>
                <button class="btn btn-ghost" id="kb-cancel">取消</button>
              </div>
            </div>
          </div>
          <!-- View Modal -->
          <div class="modal-overlay" id="kb-view-modal">
            <div class="modal modal-lg">
              <div class="modal-header">
                <h3 id="kb-view-title"></h3>
                <button class="modal-close" id="kb-view-close">&times;</button>
              </div>
              <div class="modal-body">
                <div class="kb-view-meta" id="kb-view-meta"></div>
                <div class="kb-view-content markdown-body" id="kb-view-content"></div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-edit" id="kb-view-edit">编辑</button>
                <button class="btn btn-ghost" id="kb-view-close-btn">关闭</button>
              </div>
            </div>
          </div>`;
        this.renderCategories();
    },

    bindEvents() {
        document.getElementById('kb-add-btn').addEventListener('click', () => this.openEditor());
        document.getElementById('kb-import-btn').addEventListener('click', () => document.getElementById('kb-file-input').click());
        document.getElementById('kb-file-input').addEventListener('change', e => this.handleImport(e));
        document.getElementById('kb-modal-close').addEventListener('click', () => this.closeEditor());
        document.getElementById('kb-cancel').addEventListener('click', () => this.closeEditor());
        document.getElementById('kb-save').addEventListener('click', () => this.save());
        document.getElementById('kb-search').addEventListener('input', e => {
            this.currentSearch = e.target.value;
            this.renderArticles();
        });
        document.getElementById('kb-content').addEventListener('input', () => this.updatePreview());
        document.querySelectorAll('#kb-modal .btn-ai-polish').forEach(btn => {
            btn.addEventListener('click', () => this.doAIPolish(btn));
        });
        document.getElementById('kb-modal').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closeEditor();
        });
        document.getElementById('kb-view-close').addEventListener('click', () => this.closeViewer());
        document.getElementById('kb-view-close-btn').addEventListener('click', () => this.closeViewer());
        document.getElementById('kb-view-edit').addEventListener('click', () => this.editFromViewer());
        document.getElementById('kb-view-modal').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closeViewer();
        });
    },

    renderCategories() {
        const list = document.getElementById('kb-categories');
        if (!list) return;
        list.innerHTML = this.categories.map(cat =>
            '<div class="kb-category-item' + (cat === this.currentCategory ? ' active' : '') + '" data-cat="' + cat + '">' + cat + '</div>'
        ).join('');
        list.querySelectorAll('.kb-category-item').forEach(el => {
            el.addEventListener('click', () => {
                this.currentCategory = el.dataset.cat;
                this.renderCategories();
                this.renderArticles();
            });
        });
    },

    renderArticles() {
        const list = document.getElementById('kb-article-list');
        if (!list) return;
        let articles = Storage.getAll('knowledgeArticles');
        if (this.currentCategory !== '全部') {
            articles = articles.filter(a => a.category === this.currentCategory);
        }
        if (this.currentSearch) {
            const q = this.currentSearch.toLowerCase();
            articles = articles.filter(a => a.title.toLowerCase().includes(q));
        }
        if (!articles.length) {
            const msg = this.currentSearch
                ? '未找到匹配的文章'
                : (Storage.getAll('knowledgeArticles').length === 0
                    ? '暂无文章，点击上方"新建文章"开始编写'
                    : '此分类暂无文章');
            list.innerHTML = '<div class="empty-state">' +
                '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
                '<p>' + msg + '</p></div>';
            return;
        }
        list.innerHTML = articles.map(a =>
            '<div class="kb-article-card" data-id="' + a.id + '">' +
            '<div class="kb-article-header">' +
            '<span class="kb-article-cat">' + a.category + '</span>' +
            '<h4 class="kb-article-title">' + a.title + '</h4></div>' +
            '<div class="kb-article-footer">' +
            '<span class="kb-article-date">' + new Date(a.createdAt).toLocaleDateString('zh-CN') + '</span>' +
            '<div class="kb-article-actions">' +
            '<button class="btn btn-sm btn-edit view-btn" data-id="' + a.id + '">查看</button>' +
            '<button class="btn btn-sm btn-edit edit-btn" data-id="' + a.id + '">编辑</button>' +
            '<button class="btn btn-sm btn-danger del-btn" data-id="' + a.id + '">删除</button></div></div></div>'
        ).join('');

        list.querySelectorAll('.view-btn').forEach(b => {
            b.addEventListener('click', e => { e.stopPropagation();
                const a = Storage.getById('knowledgeArticles', b.dataset.id);
                if (a) this.viewArticle(a); });
        });
        list.querySelectorAll('.edit-btn').forEach(b => {
            b.addEventListener('click', e => { e.stopPropagation();
                const a = Storage.getById('knowledgeArticles', b.dataset.id);
                if (a) this.openEditor(a); });
        });
        list.querySelectorAll('.del-btn').forEach(b => {
            b.addEventListener('click', e => { e.stopPropagation();
                if (confirm('确定删除此文章？')) {
                    Storage.delete('knowledgeArticles', b.dataset.id);
                    this.renderArticles();
                }
            });
        });
    },

    openEditor(article) {
        const modal = document.getElementById('kb-modal');
        const catSelect = document.getElementById('kb-category');
        const cats = this.categories.filter(c => c !== '全部');
        catSelect.innerHTML = cats.map(c => '<option value="' + c + '">' + c + '</option>').join('');

        if (article) {
            this.editingId = article.id;
            document.getElementById('kb-modal-title').textContent = '编辑文章';
            document.getElementById('kb-title').value = article.title;
            catSelect.value = article.category;
            document.getElementById('kb-content').value = article.content;
        } else {
            this.editingId = null;
            document.getElementById('kb-modal-title').textContent = '新建文章';
            document.getElementById('kb-title').value = '';
            catSelect.value = '编织工艺';
            document.getElementById('kb-content').value = '';
        }
        this.updatePreview();
        modal.classList.add('active');
        setTimeout(() => document.getElementById('kb-title').focus(), 100);
    },

    closeEditor() {
        document.getElementById('kb-modal').classList.remove('active');
        this.editingId = null;
    },

    updatePreview() {
        const preview = document.getElementById('kb-preview');
        if (preview) preview.innerHTML = this.renderMarkdown(document.getElementById('kb-content').value);
    },

    save() {
        const title = document.getElementById('kb-title').value.trim();
        const category = document.getElementById('kb-category').value;
        const content = document.getElementById('kb-content').value;
        if (!title) { alert('请输入文章标题'); return; }
        if (!content) { alert('请输入文章内容'); return; }
        const data = { title, category, content };
        if (this.editingId) {
            Storage.update('knowledgeArticles', this.editingId, data);
        } else {
            Storage.add('knowledgeArticles', data);
        }
        this.closeEditor();
        this.renderArticles();
    },

    viewArticle(article) {
        document.getElementById('kb-view-title').textContent = article.title;
        document.getElementById('kb-view-meta').innerHTML =
            '<span>分类：' + article.category + '</span> | <span>更新：' + new Date(article.updatedAt || article.createdAt).toLocaleDateString('zh-CN') + '</span>';
        document.getElementById('kb-view-content').innerHTML = this.renderMarkdown(article.content);
        document.getElementById('kb-view-edit').dataset.id = article.id;
        document.getElementById('kb-view-modal').classList.add('active');
    },

    closeViewer() {
        document.getElementById('kb-view-modal').classList.remove('active');
    },

    editFromViewer() {
        const id = document.getElementById('kb-view-edit').dataset.id;
        this.closeViewer();
        const article = Storage.getById('knowledgeArticles', id);
        if (article) this.openEditor(article);
    },

    async doAIPolish(btn) {
        const targetId = btn.dataset.target;
        const style = btn.dataset.style;
        const ta = document.getElementById(targetId);
        if (!ta || !ta.value.trim()) { alert('请先输入内容'); return; }
        btn.disabled = true;
        btn.textContent = '润色中…';
        try {
            const result = await AIService.polish(ta.value, style);
            ta.value = result;
            this.updatePreview();
        } catch (err) {
            if (err.message === 'err_need_config') {
                alert('请先在右上角设置中配置 AI API 地址和模型');
            } else {
                alert('润色失败：' + err.message);
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg> 润色';
        }
    },

    // ===== 文件导入 =====
    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        try {
            let text = '';
            if (ext === 'txt' || ext === 'md') {
                text = await file.text();
            } else if (ext === 'docx') {
                text = await this.readDocx(file);
            } else if (ext === 'pdf') {
                text = await this.readPdf(file);
            } else {
                alert('暂不支持 .' + ext + ' 格式，支持 .md / .txt / .docx / .pdf');
                e.target.value = '';
                return;
            }
            const name = file.name.replace(/\.(md|txt|docx|pdf)$/i, '');
            this.openEditor();
            document.getElementById('kb-title').value = name;
            document.getElementById('kb-content').value = text;
            this.updatePreview();
        } catch (err) {
            alert('导入失败：' + err.message);
        }
        e.target.value = '';
    },

    async readDocx(file) {
        if (typeof mammoth === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
        }
        const buf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        return result.value || '（无法提取内容）';
    },

    async readPdf(file) {
        if (typeof pdfjsLib === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        let text = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
            const page = await pdf.getPage(i);
            const tc = await page.getTextContent();
            text += tc.items.map(item => item.str).join(' ') + '\n';
        }
        return text || '（PDF 未能提取出文本内容）';
    },

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error('加载库失败，请检查网络连接'));
            document.head.appendChild(s);
        });
    },

    /** Lightweight Markdown → HTML renderer */
    renderMarkdown(md) {
        if (!md) return '<p style="color:var(--text-muted);">预览区域</p>';
        let html = md
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/^---$/gm, '<hr>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/^\d+\. (.+)$/gm, '<ol><li>$1</li></ol>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        if (!/^<(h[1-3]|ul|ol|pre|blockquote|hr|p)/.test(html)) {
            html = '<p>' + html + '</p>';
        }
        return html;
    }
};
