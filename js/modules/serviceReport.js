/**
 * 售后报告生成器
 */
const ServiceReportModule = {
    currentHTML: null,
    images: [],

    init() {
        this.render();
        this.bindEvents();
    },

    render() {
        const el = document.getElementById('page-service-report');
        el.innerHTML = `
          <div class="module-header">
            <h2><span class="module-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>售后报告生成器</h2>
            <p class="module-desc">快速生成专业的售后服务报告，支持导出 Word / PDF</p>
          </div>
          <div class="module-body">
            <div class="form-panel">
              <h3 class="panel-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> 报告信息</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>客户名称 <span class="required">*</span></label>
                  <input type="text" id="sr-client" placeholder="请输入客户名称">
                </div>
                <div class="form-group">
                  <label>设备型号 <span class="required">*</span></label>
                  <select id="sr-device">
                    <option value="16锭编织机">16锭编织机</option>
                    <option value="24锭编织机">24锭编织机</option>
                    <option value="32锭编织机">32锭编织机</option>
                    <option value="48锭编织机">48锭编织机</option>
                    <option value="定制设备">定制设备</option>
                    <option value="__custom__">其他（自行输入）</option>
                  </select>
                  <input type="text" id="sr-device-custom" class="input-custom" placeholder="请输入设备型号" style="display:none;">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>服务日期 <span class="required">*</span></label>
                  <input type="date" id="sr-date">
                </div>
                <div class="form-group">
                  <label>服务人员</label>
                  <input type="text" id="sr-engineer" placeholder="请输入服务人员姓名">
                </div>
              </div>
              <div class="form-group">
                <label>问题描述 <span class="required">*</span></label>
                <div class="textarea-ai-wrapper">
                  <textarea id="sr-problem" rows="4" placeholder="请描述客户反馈的问题..."></textarea>
                  <button class="btn-ai-polish" data-target="sr-problem" data-style="problem" title="AI 润色">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>
                    润色
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>处理过程 <span class="required">*</span></label>
                <div class="textarea-ai-wrapper">
                  <textarea id="sr-process" rows="5" placeholder="请详细描述故障排查与处理过程..."></textarea>
                  <button class="btn-ai-polish" data-target="sr-process" data-style="process" title="AI 润色">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>
                    润色
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>处理结果 <span class="required">*</span></label>
                <div class="textarea-ai-wrapper">
                  <textarea id="sr-result" rows="3" placeholder="请说明最终处理结果..."></textarea>
                  <button class="btn-ai-polish" data-target="sr-result" data-style="result" title="AI 润色">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>
                    润色
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>备注</label>
                <textarea id="sr-notes" rows="2" placeholder="其他需要补充的信息..."></textarea>
              </div>
              <div class="form-group image-upload-section">
                <label>现场照片</label>
                <div class="image-grid" id="sr-image-grid"></div>
                <div class="image-upload-bar">
                  <button class="btn btn-sm btn-info" id="sr-add-image" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    添加图片
                  </button>
                  <input type="file" id="sr-image-input" accept="image/*" multiple style="display:none;">
                  <span class="form-hint">支持 JPG / PNG，建议单张不超过 2MB</span>
                </div>
              </div>
              <div class="form-actions no-print">
                <button class="btn btn-primary" id="sr-generate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 生成报告</button>
                <button class="btn btn-success" id="sr-export-word" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导出 Word</button>
                <button class="btn btn-info" id="sr-export-pdf" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> 导出 PDF</button>
                <button class="btn btn-ghost" id="sr-clear">清空</button>
              </div>
            </div>
            <div class="preview-panel" id="sr-preview" style="display:none;">
              <h3 class="panel-title"><span class="preview-dot"></span> 预览</h3>
              <div class="preview-content" id="sr-preview-content"></div>
            </div>
            <div class="history-section" id="sr-history">
              <h3 class="panel-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 历史报告</h3>
              <div class="history-list" id="sr-history-list"></div>
            </div>
          </div>`;
        document.getElementById('sr-date').value = new Date().toISOString().split('T')[0];
        this.bindEquipmentToggle();
        this.renderHistory();
    },

    bindEvents() {
        document.getElementById('sr-generate').addEventListener('click', () => this.generate());
        document.getElementById('sr-export-word').addEventListener('click', () => this.exportWord());
        document.getElementById('sr-export-pdf').addEventListener('click', () => this.exportPDF());
        document.getElementById('sr-clear').addEventListener('click', () => this.clearForm());
        document.querySelectorAll('#page-service-report .btn-ai-polish').forEach(btn => {
            btn.addEventListener('click', () => this.doAIPolish(btn));
        });
        document.getElementById('sr-add-image').addEventListener('click', () => document.getElementById('sr-image-input').click());
        document.getElementById('sr-image-input').addEventListener('change', e => this.handleImageUpload(e));
    },

    bindEquipmentToggle() {
        const sel = document.getElementById('sr-device');
        const custom = document.getElementById('sr-device-custom');
        sel.addEventListener('change', () => {
            custom.style.display = sel.value === '__custom__' ? 'block' : 'none';
        });
    },

    getDevice() {
        const sel = document.getElementById('sr-device');
        const custom = document.getElementById('sr-device-custom');
        return sel.value === '__custom__'
            ? (custom.value.trim() || '其他设备')
            : sel.value;
    },

    getFormData() {
        return {
            client: document.getElementById('sr-client').value.trim(),
            device: this.getDevice(),
            date: document.getElementById('sr-date').value,
            engineer: document.getElementById('sr-engineer').value.trim(),
            problem: document.getElementById('sr-problem').value.trim(),
            process: document.getElementById('sr-process').value.trim(),
            result: document.getElementById('sr-result').value.trim(),
            notes: document.getElementById('sr-notes').value.trim(),
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
        const grid = document.getElementById('sr-image-grid');
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
        if (!d.problem) { alert('请输入问题描述'); return; }
        if (!d.process) { alert('请输入处理过程'); return; }
        if (!d.result) { alert('请输入处理结果'); return; }

        const html = this.buildHTML(d);
        this.currentHTML = html;

        const preview = document.getElementById('sr-preview');
        document.getElementById('sr-preview-content').innerHTML = html;
        preview.style.display = 'block';
        document.getElementById('sr-export-word').disabled = false;
        document.getElementById('sr-export-pdf').disabled = false;

        Storage.add('serviceReports', d);
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
          <div class="doc-title">售后服务报告</div>
          <table class="doc-meta-table">
            <tr><td width="50%"><strong>客户名称：</strong>${d.client}</td><td><strong>设备型号：</strong>${d.device}</td></tr>
            <tr><td><strong>服务日期：</strong>${d.date}</td><td><strong>服务人员：</strong>${d.engineer || '—'}</td></tr>
          </table>
          <div class="doc-divider"></div>
          <div class="doc-section-title">一、问题描述</div>
          <div class="doc-content">${d.problem.replace(/\n/g, '<br>')}</div>
          <div class="doc-section-title">二、处理过程</div>
          <div class="doc-content">${d.process.replace(/\n/g, '<br>')}</div>
          <div class="doc-section-title">三、处理结果</div>
          <div class="doc-content">${d.result.replace(/\n/g, '<br>')}</div>
          ${d.notes ? '<div class="doc-section-title">四、备注</div><div class="doc-content">' + d.notes.replace(/\n/g, '<br>') + '</div>' : ''}
          ${imagesHtml}
          <div class="doc-footer">报告生成时间：${new Date().toLocaleString('zh-CN')}</div>`;
    },

    exportWord() {
        if (!this.currentHTML) return;
        const d = this.getFormData();
        ExportUtils.exportWord(this.currentHTML, '售后报告_' + d.client + '_' + d.date);
    },

    exportPDF() {
        if (!this.currentHTML) return;
        const d = this.getFormData();
        ExportUtils.exportPDF(document.getElementById('sr-preview-content'), '售后报告_' + d.client + '_' + d.date);
    },

    clearForm() {
        ['sr-client', 'sr-problem', 'sr-process', 'sr-result', 'sr-notes', 'sr-engineer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('sr-device').value = '16锭编织机';
        document.getElementById('sr-device-custom').style.display = 'none';
        document.getElementById('sr-device-custom').value = '';
        document.getElementById('sr-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('sr-preview').style.display = 'none';
        document.getElementById('sr-export-word').disabled = true;
        document.getElementById('sr-export-pdf').disabled = true;
        this.currentHTML = null;
        this.images = [];
        const grid = document.getElementById('sr-image-grid');
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
        const list = document.getElementById('sr-history-list');
        const records = Storage.getAll('serviceReports');
        if (!records.length) {
            list.innerHTML = '<div class="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><p>暂无历史报告</p></div>';
            return;
        }
        list.innerHTML = records.slice(0, 10).map(r => `
          <div class="history-item" data-id="${r.id}">
            <div class="history-meta">
              <span class="history-date">${r.date}</span>
              <span class="history-client">${r.client}</span>
              <span class="history-equip">${r.device}</span>
            </div>
            <div class="history-preview">${r.problem.substring(0, 80)}${r.problem.length > 80 ? '…' : ''}</div>
            <button class="btn btn-sm btn-danger history-del" data-id="${r.id}">删除</button>
          </div>`).join('');
        list.querySelectorAll('.history-del').forEach(b => {
            b.addEventListener('click', e => {
                e.stopPropagation();
                if (confirm('确定删除此报告？')) {
                    Storage.delete('serviceReports', b.dataset.id);
                    this.renderHistory();
                }
            });
        });
    }
};
