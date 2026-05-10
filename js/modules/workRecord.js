/**
 * 工作记录生成器
 */
const WorkRecordModule = {
    currentHTML: null,
    images: [],

    init() {
        this.render();
        this.bindEvents();
    },

    render() {
        const el = document.getElementById('page-work-record');
        el.innerHTML = `
          <div class="module-header">
            <h2><span class="module-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>工作记录生成器</h2>
            <p class="module-desc">填写工作信息，生成标准化工作记录，支持导出 Word / PDF</p>
          </div>
          <div class="module-body">
            <div class="form-panel">
              <h3 class="panel-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> 工作信息</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>日期 <span class="required">*</span></label>
                  <input type="date" id="wr-date">
                </div>
                <div class="form-group">
                  <label>客户名称 <span class="required">*</span></label>
                  <input type="text" id="wr-client" placeholder="请输入客户名称">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>设备型号</label>
                  <select id="wr-equipment">
                    <option value="16锭编织机">16锭编织机</option>
                    <option value="24锭编织机">24锭编织机</option>
                    <option value="32锭编织机">32锭编织机</option>
                    <option value="48锭编织机">48锭编织机</option>
                    <option value="定制编织机">定制编织机</option>
                    <option value="__custom__">其他（自行输入）</option>
                  </select>
                  <input type="text" id="wr-equipment-custom" class="input-custom" placeholder="请输入设备型号" style="display:none;">
                </div>
                <div class="form-group">
                  <label>记录人</label>
                  <input type="text" id="wr-author" placeholder="请输入记录人姓名">
                </div>
              </div>
              <div class="form-group">
                <label>工作内容 <span class="required">*</span></label>
                <div class="textarea-ai-wrapper">
                  <textarea id="wr-content" rows="6" placeholder="请详细描述工作内容，例如：&#10;1. 设备调试情况&#10;2. 编织参数设置&#10;3. 样品打样结果&#10;4. 问题处理过程"></textarea>
                  <button class="btn-ai-polish" data-target="wr-content" data-style="workContent" title="AI 润色">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>
                    润色
                  </button>
                </div>
              </div>
              <div class="form-group image-upload-section">
                <label>现场照片</label>
                <div class="image-grid" id="wr-image-grid"></div>
                <div class="image-upload-bar">
                  <button class="btn btn-sm btn-info" id="wr-add-image" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    添加图片
                  </button>
                  <input type="file" id="wr-image-input" accept="image/*" multiple style="display:none;">
                  <span class="form-hint">支持 JPG / PNG，建议单张不超过 2MB</span>
                </div>
              </div>
              <div class="form-actions no-print">
                <button class="btn btn-primary" id="wr-generate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 生成记录</button>
                <button class="btn btn-success" id="wr-export-word" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导出 Word</button>
                <button class="btn btn-info" id="wr-export-pdf" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> 导出 PDF</button>
                <button class="btn btn-ghost" id="wr-clear">清空</button>
              </div>
            </div>
            <div class="preview-panel" id="wr-preview" style="display:none;">
              <h3 class="panel-title"><span class="preview-dot"></span> 预览</h3>
              <div class="preview-content" id="wr-preview-content"></div>
            </div>
            <div class="history-section" id="wr-history">
              <h3 class="panel-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 历史记录</h3>
              <div class="history-list" id="wr-history-list"></div>
            </div>
          </div>`;
        document.getElementById('wr-date').value = new Date().toISOString().split('T')[0];
        this.bindEquipmentToggle();
        this.renderHistory();
    },

    bindEvents() {
        document.getElementById('wr-generate').addEventListener('click', () => this.generate());
        document.getElementById('wr-export-word').addEventListener('click', () => this.exportWord());
        document.getElementById('wr-export-pdf').addEventListener('click', () => this.exportPDF());
        document.getElementById('wr-clear').addEventListener('click', () => this.clearForm());
        // AI polish
        document.querySelectorAll('#page-work-record .btn-ai-polish').forEach(btn => {
            btn.addEventListener('click', () => this.doAIPolish(btn));
        });
        document.getElementById('wr-add-image').addEventListener('click', () => document.getElementById('wr-image-input').click());
        document.getElementById('wr-image-input').addEventListener('change', e => this.handleImageUpload(e));
    },

    bindEquipmentToggle() {
        const sel = document.getElementById('wr-equipment');
        const custom = document.getElementById('wr-equipment-custom');
        sel.addEventListener('change', () => {
            custom.style.display = sel.value === '__custom__' ? 'block' : 'none';
        });
    },

    getEquipment() {
        const sel = document.getElementById('wr-equipment');
        const custom = document.getElementById('wr-equipment-custom');
        return sel.value === '__custom__'
            ? (custom.value.trim() || '其他设备')
            : sel.value;
    },

    getFormData() {
        return {
            date: document.getElementById('wr-date').value,
            client: document.getElementById('wr-client').value.trim(),
            equipment: this.getEquipment(),
            author: document.getElementById('wr-author').value.trim(),
            content: document.getElementById('wr-content').value.trim(),
            images: this.images
        };
    },

    handleImageUpload(e) {
        const files = e.target.files;
        if (!files.length) return;
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            if (file.size > 2 * 1024 * 1024) {
                alert('图片 ' + file.name + ' 超过 2MB，请压缩后上传');
                continue;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.images.push({
                    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
                    name: file.name,
                    data: ev.target.result
                });
                this.renderImageGrid();
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    },

    renderImageGrid() {
        const grid = document.getElementById('wr-image-grid');
        if (!grid) return;
        if (!this.images.length) { grid.innerHTML = ''; return; }
        grid.innerHTML = this.images.map(img =>
            '<div class="image-thumb" data-id="' + img.id + '">' +
            '<img src="' + img.data + '" alt="' + img.name + '">' +
            '<button class="image-del" title="删除">&times;</button>' +
            '</div>'
        ).join('');
        grid.querySelectorAll('.image-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.closest('.image-thumb').dataset.id;
                this.images = this.images.filter(i => i.id !== id);
                this.renderImageGrid();
            });
        });
    },

    generate() {
        const d = this.getFormData();
        if (!d.client) { alert('请输入客户名称'); return; }
        if (!d.content) { alert('请输入工作内容'); return; }

        const html = this.buildHTML(d);
        this.currentHTML = html;

        const preview = document.getElementById('wr-preview');
        document.getElementById('wr-preview-content').innerHTML = html;
        preview.style.display = 'block';
        document.getElementById('wr-export-word').disabled = false;
        document.getElementById('wr-export-pdf').disabled = false;

        Storage.add('workRecords', d);
        this.renderHistory();
        preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    buildHTML(d) {
        const imagesHtml = (d.images && d.images.length)
            ? '<div class="doc-images">' +
              d.images.map(img =>
                  '<div class="doc-image-item"><img src="' + img.data + '" alt="' + img.name + '">' +
                  '<div class="doc-image-name">' + img.name + '</div></div>'
              ).join('') +
              '</div>'
            : '';
        return `
          <div class="doc-title">工 作 记 录</div>
          <table class="doc-meta-table">
            <tr><td width="50%"><strong>日期：</strong>${d.date}</td><td><strong>客户：</strong>${d.client}</td></tr>
            <tr><td><strong>设备：</strong>${d.equipment}</td><td><strong>记录人：</strong>${d.author || '—'}</td></tr>
          </table>
          <div class="doc-divider"></div>
          <div class="doc-section-title">工作内容</div>
          <div class="doc-content">${d.content.replace(/\n/g, '<br>')}</div>
          ${imagesHtml}
          <div class="doc-footer">记录生成时间：${new Date().toLocaleString('zh-CN')}</div>`;
    },

    exportWord() {
        if (!this.currentHTML) return;
        const d = this.getFormData();
        ExportUtils.exportWord(this.currentHTML, '工作记录_' + d.client + '_' + d.date);
    },

    exportPDF() {
        if (!this.currentHTML) return;
        const d = this.getFormData();
        ExportUtils.exportPDF(document.getElementById('wr-preview-content'), '工作记录_' + d.client + '_' + d.date);
    },

    clearForm() {
        document.getElementById('wr-client').value = '';
        document.getElementById('wr-content').value = '';
        document.getElementById('wr-author').value = '';
        document.getElementById('wr-equipment').value = '16锭编织机';
        document.getElementById('wr-equipment-custom').style.display = 'none';
        document.getElementById('wr-equipment-custom').value = '';
        document.getElementById('wr-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('wr-preview').style.display = 'none';
        document.getElementById('wr-export-word').disabled = true;
        document.getElementById('wr-export-pdf').disabled = true;
        this.currentHTML = null;
        this.images = [];
        const grid = document.getElementById('wr-image-grid');
        if (grid) grid.innerHTML = '';
    },

    async doAIPolish(btn) {
        const targetId = btn.dataset.target;
        const style = btn.dataset.style;
        const ta = document.getElementById(targetId);
        if (!ta.value.trim()) { alert('请先输入内容'); return; }

        btn.disabled = true;
        btn.textContent = '润色中…';

        try {
            const result = await AIService.polish(ta.value, style);
            ta.value = result;
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

    renderHistory() {
        const list = document.getElementById('wr-history-list');
        const records = Storage.getAll('workRecords');
        if (!records.length) {
            list.innerHTML = '<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>暂无历史记录</p></div>';
            return;
        }
        list.innerHTML = records.slice(0, 10).map(r => `
          <div class="history-item" data-id="${r.id}">
            <div class="history-meta">
              <span class="history-date">${r.date}</span>
              <span class="history-client">${r.client}</span>
              <span class="history-equip">${r.equipment}</span>
            </div>
            <div class="history-preview">${r.content.substring(0, 80)}${r.content.length > 80 ? '…' : ''}</div>
            <button class="btn btn-sm btn-danger history-del" data-id="${r.id}">删除</button>
          </div>`).join('');
        list.querySelectorAll('.history-del').forEach(b => {
            b.addEventListener('click', e => {
                e.stopPropagation();
                if (confirm('确定删除此记录？')) {
                    Storage.delete('workRecords', b.dataset.id);
                    this.renderHistory();
                }
            });
        });
    }
};
