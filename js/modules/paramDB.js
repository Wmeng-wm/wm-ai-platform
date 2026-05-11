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
                <button class="btn btn-edit" id="param-chart-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> 图表分析</button>
              </div>
            </div>
            <!-- 图表分析面板 -->
            <div class="chart-panel" id="param-chart-panel" style="display:none;">
                <div class="chart-stats" id="chart-stats"></div>
                <div class="chart-grid">
                    <div class="chart-card">
                        <h4 class="chart-title">PPI 趋势</h4>
                        <canvas id="chart-trend"></canvas>
                        <p class="chart-tip">按客户分色，鼠标悬停查看详情</p>
                    </div>
                    <div class="chart-card">
                        <h4 class="chart-title">设备参数对比</h4>
                        <canvas id="chart-radar"></canvas>
                        <p class="chart-tip">各设备型号的参数平均值对比</p>
                    </div>
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
        document.getElementById('param-chart-btn').addEventListener('click', () => this.toggleChart());
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
                '<td data-label="日期">' + p.date + '</td>' +
                '<td data-label="客户名称">' + (p.client || '—') + '</td>' +
                '<td data-label="设备型号">' + p.device + '</td>' +
                '<td data-label="PPI">' + (p.spindles || '—') + '</td>' +
                '<td data-label="线径">' + (p.wire || '—') + '</td>' +
                '<td data-label="主弹簧">' + (p.angle || '—') + '</td>' +
                '<td data-label="刹车簧">' + (p.tension || '—') + '</td>' +
                '<td data-label="转速">' + (p.speed || '—') + '</td>' +
                '<td data-label="效率">' + (p.diameter || '—') + '</td>' +
                '<td data-label="备注" title="' + (p.notes || '') + '">' + ns + '</td>' +
                '<td data-label="操作" class="action-cell">' +
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

    // ========== CSV 解析增强版 ==========

    /**
     * 自动检测分隔符：依次尝试逗号、制表符、分号，选列数最一致的
     */
    _detectDelimiter(lines) {
        const candidates = [',', '\t', ';'];
        let best = ',';
        let bestScore = 0;
        for (const d of candidates) {
            const cols = lines.map(l => l.split(d).length);
            const avg = cols.reduce((a, b) => a + b, 0) / cols.length;
            const consistent = cols.filter(c => Math.abs(c - avg) < 2).length / cols.length;
            // 列数 > 2 且一致性 > 0.7
            if (avg > 2 && consistent > 0.7 && avg > bestScore) {
                bestScore = avg;
                best = d;
            }
        }
        return best;
    },

    /**
     * 简单的带引号 CSV 行解析
     */
    _parseCSVLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuote) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuote = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuote = true;
                } else if (ch === delimiter) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        result.push(current.trim());
        return result;
    },

    /**
     * 规范化 header 名称用于模糊匹配
     */
    _normalizeHeader(h) {
        return h.replace(/[（(].*?[)）]/g, '')    // 去掉括号内的单位
                .replace(/[^\w一-鿿]/g, '') // 去除非字母数字汉字
                .toLowerCase();
    },

    /**
     * Header 映射表（支持模糊匹配）
     */
    _getHeaderMap() {
        return {
            'date': ['日期', 'date', '日', '时间', 'service date', '年月日'],
            'client': ['客户', '客户名称', 'client', 'customer', '公司', '单位'],
            'device': ['设备', '设备型号', '型号', 'device', '设备类型', '编织机', 'machine'],
            'spindles': ['ppi', 'PPI', '编织密度', '密度', '针数', '每英寸针数', 'spindles', 'picks', 'pitch'],
            'wire': ['线径', 'wire', '线径mm', '丝径', 'wire diameter', '钢丝直径', '线材直径'],
            'angle': ['主弹簧', '弹簧', '主弹簧mm', 'spring', 'main spring', '弹簧长度'],
            'tension': ['刹车簧', '刹车', 'tension', 'brake', '刹车弹簧', '张力簧'],
            'speed': ['转速', '速度', 'speed', 'rpm', 'rpm/min', '编织速度', '转速rpm'],
            'diameter': ['效率', 'mm/min', 'mmmin', 'mm min', '编织效率', '线速度', '速度mmmin', 'feed', '牵引速度'],
            'notes': ['备注', 'notes', 'note', '说明', '描述', '备注说明', '备注信息']
        };
    },

    /**
     * 增强型 CSV 解析：自动检测分隔符、模糊匹配 header、处理引号
     */
    parseCSV(text) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2) {
            // 尝试用更松的条件：没有标题行也能解析
            return this._parseFreeform(text);
        }

        const delimiter = this._detectDelimiter(lines);
        const headerLine = this._parseCSVLine(lines[0], delimiter);
        const hd = headerLine.map(h => h.trim());

        // 构建反向映射：规范化名称 → 标准字段名
        const headerMap = this._getHeaderMap();
        const revMap = {};
        for (const [stdName, aliases] of Object.entries(headerMap)) {
            for (const alias of aliases) {
                revMap[this._normalizeHeader(alias)] = stdName;
            }
        }

        // 映射每列的字段名
        const colFields = hd.map(h => {
            const norm = this._normalizeHeader(h);
            return revMap[norm] || null; // 没匹配到的列忽略
        });

        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const vals = this._parseCSVLine(lines[i], delimiter);
            const entry = {};
            let hasData = false;
            colFields.forEach((field, idx) => {
                if (field && vals[idx] !== undefined && vals[idx] !== '') {
                    entry[field] = vals[idx];
                    hasData = true;
                }
            });
            if (!hasData) continue;
            // 自动补日期
            if (!entry.date) entry.date = new Date().toISOString().split('T')[0];
            // 至少要有设备或客户或 PPI 之一
            if (entry.device || entry.client || entry.spindles) {
                Storage.add('parameters', entry);
                count++;
            }
        }
        return count;
    },

    /**
     * 自由格式解析：没有固定表头时，尝试从文本中提取关键参数
     */
    _parseFreeform(text) {
        const patterns = {
            date: /日[期期]\s*[:：]?\s*(\d{4}[\-年]\d{1,2}[\-月]\d{1,2})/,
            client: /客户[名称]?\s*[:：]?\s*([^\s,，、\n]{2,20})/,
            device: /(?:设备|编织机|机型)[^:：]*[:：]?\s*([^\s,，、\n]{2,20})/,
            spindles: /(?:PPI|ppi|编织密度|密度)\s*[:：]?\s*(\d+\.?\d*)/,
            wire: /(?:线径|丝径|钢丝直径)\s*[:：]?\s*(\d+\.?\d*)/,
            angle: /(?:主弹簧|弹簧)\s*[:：]?\s*(\d+\.?\d*)/,
            tension: /(?:刹车簧|刹车|张力簧)\s*[:：]?\s*(\d+\.?\d*)/,
            speed: /(?:转速|速度)\s*[:：]?\s*(\d+)/,
            diameter: /(?:效率|牵引速度|线速度)\s*[:：]?\s*(\d+\.?\d*)/
        };

        const entry = { date: new Date().toISOString().split('T')[0] };
        let found = false;
        for (const [field, regex] of Object.entries(patterns)) {
            const m = text.match(regex);
            if (m) {
                entry[field] = m[1];
                found = true;
            }
        }
        // 提取备注：剩余文本
        if (found) {
            // 去掉已匹配的部分，剩下作为备注
            let remaining = text;
            for (const regex of Object.values(patterns)) {
                remaining = remaining.replace(regex, '');
            }
            const cleaned = remaining.replace(/[\s,，、;；]+/g, ' ').trim();
            if (cleaned) entry.notes = cleaned.substring(0, 200);

            Storage.add('parameters', entry);
            return 1;
        }
        return 0;
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
        const self = this;

        if (ext === 'csv' || ext === 'txt') {
            reader.onload = ev => {
                const count = this.parseCSV(ev.target.result);
                if (count > 0) {
                    alert('成功导入 ' + count + ' 条参数记录');
                } else {
                    alert('未能从文件中识别出参数数据，请检查文件格式。\n支持 CSV 格式：第一行为表头，包含"日期/设备/PPI/线径/主弹簧/刹车簧/转速/效率/备注"等列名。');
                }
                this.renderTable();
            };
            reader.readAsText(file, 'UTF-8');
        } else if (ext === 'docx') {
            this.importDocx(file);
        } else if (ext === 'pdf') {
            this.importPdf(file);
        } else {
            alert('不支持的文件格式：.' + ext + '\n支持 CSV / TXT / Word / PDF');
        }
        e.target.value = '';
    },

    /**
     * Word 文档导入：优先尝试表格结构提取，然后是自由格式
     */
    async importDocx(file) {
        try {
            const text = await this.readDocx(file);
            let count = this.parseCSV(text);
            if (count === 0) {
                count = this._parseFreeform(text);
                if (count > 0) {
                    alert('从 Word 文档中提取到 ' + count + ' 条参数记录（自由格式识别）');
                } else {
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
            } else {
                alert('成功从 Word 文档导入 ' + count + ' 条参数记录');
            }
            this.renderTable();
        } catch (err) {
            alert('导入 Word 文档失败：' + err.message);
        }
    },

    /**
     * PDF 导入：同上
     */
    async importPdf(file) {
        try {
            const text = await this.readPdf(file);
            let count = this.parseCSV(text);
            if (count === 0) {
                count = this._parseFreeform(text);
                if (count > 0) {
                    alert('从 PDF 中提取到 ' + count + ' 条参数记录（自由格式识别）');
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
            } else {
                alert('成功从 PDF 导入 ' + count + ' 条参数记录');
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
    },

    // ========== 图表分析 ==========

    _chartInstances: [],
    _chartJsLoaded: false,

    async toggleChart() {
        const panel = document.getElementById('param-chart-panel');
        const btn = document.getElementById('param-chart-btn');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            btn.textContent = '关闭图表';
            // 恢复按钮图标
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> 关闭图表';
            await this._loadChartJs();
            this._renderCharts();
        } else {
            panel.style.display = 'none';
            this._destroyCharts();
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> 图表分析';
        }
    },

    async _loadChartJs() {
        if (this._chartJsLoaded && typeof Chart !== 'undefined') return;
        const cdns = [
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js'
        ];
        for (const src of cdns) {
            try {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = src;
                    s.onload = resolve;
                    s.onerror = reject;
                    document.head.appendChild(s);
                });
                if (typeof Chart !== 'undefined') {
                    this._chartJsLoaded = true;
                    // 注册暗色主题默认配置
                    Chart.defaults.color = '#94a3b8';
                    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
                    return;
                }
            } catch (e) { /* try next CDN */ }
        }
        alert('图表库加载失败，请检查网络连接');
    },

    _renderCharts() {
        const params = Storage.getAll('parameters');
        if (!params.length) {
            document.getElementById('chart-stats').innerHTML = '<div class="empty-state"><p>暂无数据，添加参数后查看图表</p></div>';
            return;
        }
        this._destroyCharts();
        this._renderStats(params);
        this._renderTrendChart(params);
        this._renderRadarChart(params);
    },

    _destroyCharts() {
        this._chartInstances.forEach(c => { try { c.destroy(); } catch(e) {} });
        this._chartInstances = [];
    },

    _renderStats(params) {
        const clients = new Set(params.filter(p => p.client).map(p => p.client));
        const devices = new Set(params.filter(p => p.device).map(p => p.device));
        // 计算各字段统计
        const fields = [
            { key: 'spindles', label: 'PPI', unit: '' },
            { key: 'wire', label: '线径', unit: 'mm' },
            { key: 'angle', label: '主弹簧', unit: 'mm' },
            { key: 'tension', label: '刹车簧', unit: 'mm' },
            { key: 'speed', label: '转速', unit: 'rpm' },
            { key: 'diameter', label: '效率', unit: 'mm/min' }
        ];
        const statsHtml = fields.map(f => {
            const vals = params.map(p => parseFloat(p[f.key])).filter(v => !isNaN(v));
            if (!vals.length) return '';
            const max = Math.max(...vals);
            const min = Math.min(...vals);
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            return `<div class="stat-card">
                <div class="stat-card-label">${f.label}</div>
                <div class="stat-card-values">
                    <span>最大 <strong>${max}${f.unit}</strong></span>
                    <span>最小 <strong>${min}${f.unit}</strong></span>
                    <span>平均 <strong>${avg.toFixed(2)}${f.unit}</strong></span>
                </div>
            </div>`;
        }).join('');

        document.getElementById('chart-stats').innerHTML = `
            <div class="stat-card-row">
                <div class="stat-card stat-card-summary">
                    <div class="stat-card-label">概览</div>
                    <div class="stat-card-values">
                        <span>记录 <strong>${params.length}</strong></span>
                        <span>客户 <strong>${clients.size}</strong></span>
                        <span>设备 <strong>${devices.size}</strong></span>
                    </div>
                </div>
            </div>
            <div class="stat-card-row">${statsHtml}</div>`;
    },

    _renderTrendChart(params) {
        const canvas = document.getElementById('chart-trend');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // 按客户分组有 PPI 的数据
        const byClient = {};
        const allDates = new Set();
        params.forEach(p => {
            const ppi = parseFloat(p.spindles);
            if (isNaN(ppi) || !p.date) return;
            const client = p.client || '未知客户';
            if (!byClient[client]) byClient[client] = {};
            byClient[client][p.date] = ppi;
            allDates.add(p.date);
        });
        const dates = [...allDates].sort();
        if (!dates.length) {
            ctx.canvas.parentNode.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">无 PPI 数据</p>';
            return;
        }

        const colors = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
        const datasets = Object.entries(byClient).map(([client, data], idx) => ({
            label: client,
            data: dates.map(d => data[d] ?? null),
            borderColor: colors[idx % colors.length],
            backgroundColor: colors[idx % colors.length] + '22',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: true
        }));

        const chart = new Chart(ctx, {
            type: 'line',
            data: { labels: dates, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 16, usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            title: items => '日期：' + items[0].label,
                            label: item => item.dataset.label + '：PPI ' + item.parsed.y
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: '日期' }
                    },
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'PPI' }
                    }
                }
            }
        });
        this._chartInstances.push(chart);
    },

    _renderRadarChart(params) {
        const canvas = document.getElementById('chart-radar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // 按设备型号分组算平均值
        const fields = ['spindles', 'wire', 'angle', 'tension', 'speed', 'diameter'];
        const labels = ['PPI', '线径', '主弹簧', '刹车簧', '转速', '效率'];
        const byDevice = {};
        params.forEach(p => {
            const d = p.device || '未知设备';
            if (!byDevice[d]) byDevice[d] = [];
            byDevice[d].push(p);
        });

        const colors = ['#0ea5e9', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#14b8a6'];
        const datasets = Object.entries(byDevice).map(([device, items], idx) => {
            const vals = fields.map(f => {
                const nums = items.map(p => parseFloat(p[f])).filter(v => !isNaN(v));
                if (!nums.length) return 0;
                return nums.reduce((a, b) => a + b, 0) / nums.length;
            });
            return {
                label: device,
                data: vals,
                borderColor: colors[idx % colors.length],
                backgroundColor: colors[idx % colors.length] + '44',
                borderWidth: 2,
                pointRadius: 3
            };
        });

        // 如果没有足够的维度数据则跳过
        if (!datasets.length) {
            ctx.canvas.parentNode.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">数据不足，无法生成雷达图</p>';
            return;
        }

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 16, usePointStyle: true }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: false,
                        ticks: { backdropColor: 'transparent' }
                    }
                }
            }
        });
        this._chartInstances.push(chart);
    }
};
