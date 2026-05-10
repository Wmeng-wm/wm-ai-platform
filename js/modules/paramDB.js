/**
 * 参数数据库 - 支持导入(文件/工作记录)，字段：PPI/主弹簧/刹车簧/mm-min
 */
const ParamDBModule = {
    editingId: null,
    currentSearch: '',

    init() {
        this.render();
        this.bindEvents();
        this.renderTable();
    },

    render() {
        const el = document.getElementById('page-param-db');
        el.innerHTML = `
          <div class="module-header">
            <h2><span class="module-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg></span>参数数据库</h2>
            <p class="module-desc">管理编织工艺参数，支持导入 CSV 文件或从工作记录一键导入</p>
          </div>
          <div class="module-body">
            <div class="toolbar">
              <div class="search-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="param-search" placeholder="搜索参数..." />
              </div>
              <div class="btn-group">
                <button class="btn btn-primary" id="param-add-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加参数</button>
                <button class="btn btn-info" id="param-import-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 导入</button>
              </div>
            </div>
            <!-- 导入菜单 -->
            <div class="import-menu" id="param-import-menu" style="display:none;">
              <div class="import-menu-item" id="param-import-file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                从文件导入 (CSV / TXT / Word / PDF)
              </div>
              <div class="import-menu-item" id="param-import-work">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                从工作记录导入
              </div>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead><tr>
                  <th>日期</th><th>客户名称</th><th>设备型号</th><th>PPI</th><th>线径 (mm)</th>
                  <th>主弹簧 (mm)</th><th>刹车簧 (mm)</th><th>转速 (rpm/min)</th><th>效率 (mm/min)</th><th>备注</th><th>操作</th>
                </tr></thead>
                <tbody id="param-table-body"></tbody>
              </table>
            </div>
            <div class="table-footer"><span id="param-count">共 0 条记录</span></div>
          </div>
          <!-- 参数编辑弹窗 -->
          <div class="modal-overlay" id="param-modal">
            <div class="modal">
              <div class="modal-header">
                <h3 id="param-modal-title">添加参数</h3>
                <button class="modal-close" id="param-modal-close">&times;</button>
              </div>
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group"><label>日期</label><input type="date" id="param-date"></div>
                  <div class="form-group"><label>客户名称</label><input type="text" id="param-client" placeholder="请输入客户名称"></div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>设备型号</label>
                    <select id="param-device">
                      <option value="16锭编织机">16锭编织机</option>
                      <option value="24锭编织机">24锭编织机</option>
                      <option value="32锭编织机">32锭编织机</option>
                      <option value="48锭编织机">48锭编织机</option>
                      <option value="__custom__">其他（自行输入）</option>
                    </select>
                    <input type="text" id="param-device-custom" class="input-custom" placeholder="请输入设备型号" style="display:none;">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>PPI</label><input type="text" id="param-spindles" placeholder="每英寸编织针数"></div>
                  <div class="form-group"><label>线径 (mm)</label><input type="text" id="param-wire" placeholder="0.05"></div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>主弹簧 (mm)</label><input type="text" id="param-angle" placeholder="主弹簧 mm"></div>
                  <div class="form-group"><label>刹车簧 (mm)</label><input type="text" id="param-tension" placeholder="刹车簧 mm"></div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label>转速 (rpm/min)</label><input type="text" id="param-speed" placeholder="转速 rpm/min"></div>
                  <div class="form-group"><label>效率 (mm/min)</label><input type="text" id="param-diameter" placeholder="效率 mm/min"></div>
                </div>
                <div class="form-group"><label>备注</label>
                  <textarea id="param-notes" rows="2" placeholder="其他参数说明..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-primary" id="param-save">保存</button>
                <button class="btn btn-ghost" id="param-cancel">取消</button>
              </div>
            </div>
          </div>
          <!-- 工作记录导入弹窗 -->
          <div class="modal-overlay" id="param-import-modal">
            <div class="modal" style="max-width:640px;">
              <div class="modal-header">
                <h3>从工作记录导入参数</h3>
                <button class="modal-close" id="param-import-close">&times;</button>
              </div>
              <div class="modal-body" id="param-import-body">
                <p style="color:var(--text-muted);margin-bottom:12px;">选择一条工作记录，将其日期和设备型号导入为参数条目：</p>
                <div id="param-import-list"></div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-ghost" id="param-import-cancel">取消</button>
              </div>
            </div>
          </div>
          <!-- 隐藏的文件输入 -->
          <input type="file" id="param-file-input" accept=".csv,.txt,.docx,.pdf" style="display:none;">`;
        document.getElementById('param-date').value = new Date().toISOString().split('T')[0];
        this.bindEquipmentToggle();
    },

    bindEquipmentToggle() {
        const sel = document.getElementById('param-device');
        const custom = document.getElementById('param-device-custom');
        if (sel && custom) {
            sel.addEventListener('change', () => {
                custom.style.display = sel.value === '__custom__' ? 'block' : 'none';
            });
        }
    },

    getDeviceValue() {
        const sel = document.getElementById('param-device');
        const custom = document.getElementById('param-device-custom');
        return sel.value === '__custom__'
            ? (custom.value.trim() || '其他设备')
            : sel.value;
    },

    bindEvents() {
        document.getElementById('param-add-btn').addEventListener('click', () => this.openModal());
        document.getElementById('param-import-btn').addEventListener('click', () => this.toggleImportMenu());
        document.getElementById('param-import-file').addEventListener('click', () => this.importFromFile());
        document.getElementById('param-import-work').addEventListener('click', () => this.showWorkImport());
        document.getElementById('param-modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('param-cancel').addEventListener('click', () => this.closeModal());
        document.getElementById('param-save').addEventListener('click', () => this.save());
        document.getElementById('param-import-close').addEventListener('click', () => this.closeImportModal());
        document.getElementById('param-import-cancel').addEventListener('click', () => this.closeImportModal());
        document.getElementById('param-file-input').addEventListener('change', e => this.handleFile(e));
        document.getElementById('param-search').addEventListener('input', e => {
            this.currentSearch = e.target.value;
            this.renderTable();
        });
        document.getElementById('param-modal').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closeModal();
        });
        document.getElementById('param-import-modal').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closeImportModal();
        });
        // 点击其他地方关闭导入菜单
        document.addEventListener('click', e => {
            const menu = document.getElementById('param-import-menu');
            const btn = document.getElementById('param-import-btn');
            if (menu.style.display !== 'none' && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    },

    toggleImportMenu() {
        const menu = document.getElementById('param-import-menu');
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    },

    openModal(data) {
        const modal = document.getElementById('param-modal');
        const deviceSel = document.getElementById('param-device');
        const customInput = document.getElementById('param-device-custom');
        if (data) {
            this.editingId = data.id;
            document.getElementById('param-modal-title').textContent = '编辑参数';
            document.getElementById('param-date').value = data.date || '';
            document.getElementById('param-client').value = data.client || '';
            const std = ['16锭编织机', '24锭编织机', '32锭编织机', '48锭编织机', '定制设备'];
            if (std.includes(data.device)) {
                deviceSel.value = data.device;
                customInput.style.display = 'none';
                customInput.value = '';
            } else {
                deviceSel.value = '__custom__';
                customInput.style.display = 'block';
                customInput.value = data.device || '';
            }
            document.getElementById('param-spindles').value = data.spindles || '';
            document.getElementById('param-wire').value = data.wire || '';
            document.getElementById('param-angle').value = data.angle || '';
            document.getElementById('param-tension').value = data.tension || '';
            document.getElementById('param-speed').value = data.speed || '';
            document.getElementById('param-diameter').value = data.diameter || '';
            document.getElementById('param-notes').value = data.notes || '';
        } else {
            this.editingId = null;
            document.getElementById('param-modal-title').textContent = '添加参数';
            document.getElementById('param-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('param-client').value = '';
            deviceSel.value = '16锭编织机';
            customInput.style.display = 'none';
            customInput.value = '';
            document.getElementById('param-spindles').value = '';
            document.getElementById('param-wire').value = '';
            document.getElementById('param-angle').value = '';
            document.getElementById('param-tension').value = '';
            document.getElementById('param-speed').value = '';
            document.getElementById('param-diameter').value = '';
            document.getElementById('param-notes').value = '';
        }
        document.getElementById('param-import-menu').style.display = 'none';
        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('param-modal').classList.remove('active');
        this.editingId = null;
    },

    save() {
        const data = {
            date: document.getElementById('param-date').value,
            client: document.getElementById('param-client').value.trim(),
            device: this.getDeviceValue(),
            spindles: document.getElementById('param-spindles').value,
            wire: document.getElementById('param-wire').value,
            angle: document.getElementById('param-angle').value,
            tension: document.getElementById('param-tension').value,
            speed: document.getElementById('param-speed').value,
            diameter: document.getElementById('param-diameter').value,
            notes: document.getElementById('param-notes').value
        };
        if (!data.date) { alert('请选择日期'); return; }
        if (this.editingId) {
            Storage.update('parameters', this.editingId, data);
        } else {
            Storage.add('parameters', data);
        }
        this.closeModal();
        this.renderTable();
    },

    deleteParam(id) {
        if (confirm('确定删除此参数？')) {
            Storage.delete('parameters', id);
            this.renderTable();
        }
    },

    renderTable() {
        const tbody = document.getElementById('param-table-body');
        const params = this.currentSearch
            ? Storage.search('parameters', this.currentSearch, ['device', 'notes', 'wire', 'client'])
            : Storage.getAll('parameters');
        document.getElementById('param-count').textContent = '共 ' + params.length + ' 条记录';
        if (!params.length) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-cell">' +
                (this.currentSearch ? '未找到匹配的参数' : '暂无参数，点击上方"添加参数"或"导入"') + '</td></tr>';
            return;
        }
        tbody.innerHTML = params.map(p => {
            const ns = p.notes ? p.notes.substring(0, 10) + (p.notes.length > 10 ? '…' : '') : '—';
            return '<tr>' +
                '<td>' + p.date + '</td>' +
                '<td>' + (p.client || '—') + '</td>' +
                '<td>' + p.device + '</td>' +
                '<td>' + (p.spindles || '—') + '</td>' +
                '<td>' + (p.wire || '—') + '</td>' +
                '<td>' + (p.angle || '—') + '</td>' +
                '<td>' + (p.tension || '—') + '</td>' +
                '<td>' + (p.speed || '—') + '</td>' +
                '<td>' + (p.diameter || '—') + '</td>' +
                '<td title="' + (p.notes || '') + '">' + ns + '</td>' +
                '<td class="action-cell">' +
                '<button class="btn btn-sm btn-edit" data-id="' + p.id + '">编辑</button>' +
                '<button class="btn btn-sm btn-danger" data-id="' + p.id + '">删除</button></td></tr>';
        }).join('');
        tbody.querySelectorAll('.btn-edit').forEach(b => {
            b.addEventListener('click', () => {
                const p = Storage.getById('parameters', b.dataset.id);
                if (p) this.openModal(p);
            });
        });
        tbody.querySelectorAll('.btn-danger').forEach(b => {
            b.addEventListener('click', () => this.deleteParam(b.dataset.id));
        });
    },

    // ===== 导入功能 =====

    importFromFile() {
        document.getElementById('param-import-menu').style.display = 'none';
        document.getElementById('param-file-input').click();
    },

    handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        if (ext === 'csv' || ext === 'txt') {
            reader.onload = ev => {
                const count = this.parseCSV(ev.target.result);
                alert('成功导入 ' + count + ' 条参数记录');
                this.renderTable();
            };
            reader.readAsText(file, 'UTF-8');
        } else if (ext === 'docx') {
            this.importDocx(file);
        } else if (ext === 'pdf') {
            this.importPdf(file);
        } else {
            alert('不支持的文件格式：.' + ext);
        }
        e.target.value = '';
    },

    async importDocx(file) {
        try {
            const text = await this.readDocx(file);
            const count = this.parseCSV(text);
            if (count > 0) {
                alert('成功从 Word 文档导入 ' + count + ' 条参数记录');
            } else {
                // 没解析出 CSV，显示原始文本让用户确认
                if (confirm('未能从文档中解析出结构化数据。是否将全文作为备注创建一条记录？')) {
                    Storage.add('parameters', {
                        date: new Date().toISOString().split('T')[0],
                        device: '导入文档',
                        notes: '从 ' + file.name + ' 导入的文本：\n' + text.substring(0, 500)
                    });
                    this.renderTable();
                    alert('已创建一条包含文本内容的参数记录');
                }
            }
            this.renderTable();
        } catch (err) {
            alert('导入 Word 文档失败：' + err.message);
        }
    },

    async importPdf(file) {
        try {
            const text = await this.readPdf(file);
            const count = this.parseCSV(text);
            if (count > 0) {
                alert('成功从 PDF 导入 ' + count + ' 条参数记录');
            } else {
                if (confirm('未能从 PDF 中解析出结构化数据。是否将全文作为备注创建一条记录？')) {
                    Storage.add('parameters', {
                        date: new Date().toISOString().split('T')[0],
                        device: '导入PDF',
                        notes: '从 ' + file.name + ' 导入的文本：\n' + text.substring(0, 500)
                    });
                    this.renderTable();
                    alert('已创建一条包含文本内容的参数记录');
                }
            }
            this.renderTable();
        } catch (err) {
            alert('导入 PDF 失败：' + err.message);
        }
    },

    async readDocx(file) {
        if (typeof mammoth === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
        }
        const buf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        return result.value || '';
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
        return text;
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

    parseCSV(text) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) { alert('文件格式错误，需要至少包含标题行和数据行'); return 0; }

        const hd = lines[0].split(',').map(s => s.trim());
        const map = {
            '日期': 'date', '设备型号': 'device', '设备': 'device',
            '客户名称': 'client', '客户': 'client',
            'ppi': 'spindles', 'PPI': 'spindles', '主弹簧': 'angle',
            '刹车簧': 'tension', '线径': 'wire', '速度': 'speed', '转速': 'speed',
            'mm/min': 'diameter', '效率': 'diameter', 'mmmin': 'diameter', '备注': 'notes'
        };

        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(s => s.trim());
            const entry = {};
            hd.forEach((h, idx) => {
                const key = map[h] || h;
                if (vals[idx] !== undefined && vals[idx] !== '') entry[key] = vals[idx];
            });
            if (entry.date && entry.device) {
                Storage.add('parameters', entry);
                count++;
            }
        }
        return count;
    },

    showWorkImport() {
        document.getElementById('param-import-menu').style.display = 'none';
        const records = Storage.getAll('workRecords');
        const list = document.getElementById('param-import-list');
        if (!records.length) {
            list.innerHTML = '<div class="empty-state"><p>暂无工作记录</p></div>';
        } else {
            list.innerHTML = records.slice(0, 20).map(r => {
                const preview = (r.content || '').substring(0, 50);
                return '<div class="import-record-item" data-id="' + r.id + '">' +
                    '<div class="import-record-info">' +
                    '<span class="import-record-date">' + r.date + '</span>' +
                    '<span class="import-record-client">' + (r.client || '') + '</span>' +
                    '<span class="import-record-equip">' + (r.equipment || '') + '</span>' +
                    '<span class="import-record-preview">' + (preview ? preview + (r.content && r.content.length > 50 ? '…' : '') : '') + '</span>' +
                    '</div>' +
                    '<button class="btn btn-sm btn-edit import-do" data-id="' + r.id + '">导入参数</button>' +
                    '</div>';
            }).join('');
        }
        list.querySelectorAll('.import-do').forEach(btn => {
            btn.addEventListener('click', () => {
                const r = Storage.getById('workRecords', btn.dataset.id);
                if (r) this.importWorkRecord(r);
            });
        });
        document.getElementById('param-import-modal').classList.add('active');
    },

    importWorkRecord(record) {
        document.getElementById('param-import-modal').classList.remove('active');
        this.openModal({
            date: record.date || new Date().toISOString().split('T')[0],
            client: record.client || '',
            device: record.equipment || '',
            spindles: '', wire: '', angle: '', tension: '', speed: '', diameter: '', notes: '来自工作记录：' + (record.client || '')
        });
    },

    closeImportModal() {
        document.getElementById('param-import-modal').classList.remove('active');
    }
};
