/**
 * 导出工具 - 使用 docx 库生成真正的 .docx 文件
 * 如果 CDN 不可用，自动降级为 HTML+Word XML 格式
 */
const ExportUtils = {
    _docxLoaded: false,

    /**
     * 按顺序尝试多个 CDN 加载 docx 库
     */
    async _loadDocxLib() {
        if (window.docx) { this._docxLoaded = true; return window.docx; }
        const cdns = [
            'https://cdn.jsdelivr.net/npm/docx@8.2.4/build/index.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/docx/8.2.4/docx.min.js',
            'https://unpkg.com/docx@8.2.4/build/index.min.js'
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
                if (window.docx) { this._docxLoaded = true; return window.docx; }
            } catch (e) {
                console.warn('docx CDN 加载失败:', src);
            }
        }
        throw new Error('所有 CDN 均无法加载 docx 库');
    },

    _saveBlob(blob, fileName, ext) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace(/[\\/:*?"<>|]/g, '_') + '.' + (ext || 'docx');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 导出 Word 文档
     * @param {Object} docData - 文档数据
     * @param {string} docData.title - 文档大标题
     * @param {Array} docData.meta - [[label, value], ...] 元数据表格
     * @param {Array} docData.sections - [{ heading: '章节名', content: '文本内容' }, ...]
     * @param {Array} [docData.images] - [{ data: 'data:image/...', name: '...' }]
     * @param {string} [docData.footer] - 底部文字
     * @param {string} fileName - 文件名（不含扩展名）
     */
    async exportWord(docData, fileName) {
        // 先尝试用 docx 库生成标准 .docx
        try {
            await this._loadDocxLib();
            const blob = await this._buildDocx(docData);
            this._saveBlob(blob, fileName, 'docx');
            return;
        } catch (e) {
            console.warn('docx 库加载失败，使用 Word HTML 降级方案:', e.message);
        }
        // 降级：生成 Word 可识别的 HTML → .doc
        const html = this._buildWordHTML(docData);
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, html], { type: 'application/msword' });
        this._saveBlob(blob, fileName, 'doc');
    },

    /**
     * 使用 docx 库构建 .docx
     */
    async _buildDocx(docData) {
        const docx = window.docx;
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
                WidthType, AlignmentType, BorderStyle, ImageRun } = docx;
        const children = [];

        // 标题
        if (docData.title) {
            children.push(new Paragraph({
                children: [new TextRun({ text: docData.title, bold: true, size: 36, font: 'SimHei' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
            }));
        }

        // 元数据表格
        if (docData.meta && docData.meta.length) {
            const half = Math.ceil(docData.meta.length / 2);
            const rows = [];
            for (let i = 0; i < half; i++) {
                const left = docData.meta[i];
                const right = docData.meta[i + half];
                const makeCell = (pair) => {
                    if (!pair) return new TableCell({ children: [new Paragraph({ children: [] })] });
                    return new TableCell({
                        children: [new Paragraph({
                            children: [
                                new TextRun({ text: pair[0] + '：', bold: true, size: 20, font: 'SimSun' }),
                                new TextRun({ text: pair[1] || '—', size: 20, font: 'SimSun' })
                            ],
                            spacing: { before: 40, after: 40 }
                        })]
                    });
                };
                rows.push(new TableRow({ children: [makeCell(left), makeCell(right)] }));
            }
            children.push(new Table({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    insideHorizontal: { style: BorderStyle.NONE, size: 0 },
                    insideVertical: { style: BorderStyle.NONE, size: 0 },
                    top: { style: BorderStyle.NONE, size: 0 },
                    bottom: { style: BorderStyle.NONE, size: 0 },
                    left: { style: BorderStyle.NONE, size: 0 },
                    right: { style: BorderStyle.NONE, size: 0 }
                }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: '', size: 1 })],
                spacing: { before: 100, after: 100 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } }
            }));
        }

        // 章节
        if (docData.sections) {
            for (const sec of docData.sections) {
                if (sec.heading) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: sec.heading, bold: true, size: 22, font: 'SimHei' })],
                        spacing: { before: 200, after: 100 }
                    }));
                }
                if (sec.content) {
                    const paras = sec.content.split('\n');
                    for (const line of paras) {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: line || ' ', size: 20, font: 'FangSong' })],
                            spacing: { after: 60 }
                        }));
                    }
                    children.push(new Paragraph({ children: [new TextRun({ text: '', size: 1 })], spacing: { after: 80 } }));
                }
            }
        }

        // 图片
        if (docData.images && docData.images.length) {
            for (const img of docData.images) {
                try {
                    const imgEl = new Image();
                    imgEl.src = img.data;
                    await new Promise((resolve, reject) => {
                        imgEl.onload = resolve;
                        imgEl.onerror = reject;
                    });
                    const maxW = 500;
                    let w = imgEl.naturalWidth;
                    let h = imgEl.naturalHeight;
                    if (w > maxW) { h = h * maxW / w; w = maxW; }
                    const b64 = img.data.split(',')[1] || img.data;
                    children.push(new Paragraph({
                        children: [
                            new ImageRun({ data: b64, transformation: { width: w, height: h }, type: docx.ImageType.PNG })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100, after: 60 }
                    }));
                    if (img.name) {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: img.name, size: 16, color: '666666', font: 'FangSong' })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }));
                    }
                } catch (e) {
                    console.warn('图片插入失败:', img.name, e);
                }
            }
        }

        // 页脚
        if (docData.footer) {
            children.push(new Paragraph({
                children: [new TextRun({ text: docData.footer, size: 16, color: '888888', font: 'FangSong' })],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 400 }
            }));
        }

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
                children
            }]
        });

        return await Packer.toBlob(doc);
    },

    /**
     * 降级方案：生成 Word 兼容的 HTML（.doc 格式）
     * 使用 mso-application 指令让 Word 识别为合法文档
     */
    _buildWordHTML(docData) {
        // 构建元数据表格 HTML
        let metaHtml = '';
        if (docData.meta && docData.meta.length) {
            const half = Math.ceil(docData.meta.length / 2);
            const rows = [];
            for (let i = 0; i < half; i++) {
                const left = docData.meta[i];
                const right = docData.meta[i + half];
                const leftCell = left ? `<td><b>${left[0]}：</b>${left[1] || '—'}</td>` : '<td></td>';
                const rightCell = right ? `<td><b>${right[0]}：</b>${right[1] || '—'}</td>` : '<td></td>';
                rows.push(`<tr>${leftCell}${rightCell}</tr>`);
            }
            metaHtml = `<table class="meta">${rows.join('')}</table><hr>`;
        }

        // 构建章节 HTML
        let bodyHtml = '';
        if (docData.sections) {
            for (const sec of docData.sections) {
                if (sec.heading) bodyHtml += `<h2>${sec.heading}</h2>`;
                if (sec.content) bodyHtml += `<p>${sec.content.replace(/\n/g, '<br>')}</p>`;
            }
        }

        // 图片
        if (docData.images && docData.images.length) {
            for (const img of docData.images) {
                bodyHtml += `<div style="text-align:center;margin:10px 0;">
                    <img src="${img.data}" style="max-width:500px;">
                    ${img.name ? `<p style="font-size:9pt;color:#666;">${img.name}</p>` : ''}
                </div>`;
            }
        }

        // 页脚
        if (docData.footer) {
            bodyHtml += `<p class="footer">${docData.footer}</p>`;
        }

        return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  body { font-family: '宋体', SimSun, serif; font-size: 12pt; line-height: 1.8; padding: 40pt; }
  .doc-title { font-family: '黑体', SimHei; font-size: 22pt; font-weight: bold; text-align: center; margin-bottom: 20pt; letter-spacing: 4pt; }
  table.meta { width: 100%; border-collapse: collapse; margin: 10pt 0; }
  table.meta td { padding: 2pt 8pt; border: none; font-size: 12pt; }
  h1 { font-family: '黑体', SimHei; font-size: 18pt; font-weight: bold; text-align: center; }
  h2 { font-family: '黑体', SimHei; font-size: 14pt; font-weight: bold; margin: 16pt 0 8pt; }
  p { font-family: '仿宋', FangSong; font-size: 12pt; line-height: 1.8; margin: 6pt 0; }
  hr { border: none; border-top: 1pt solid #999; margin: 12pt 0; }
  img { max-width: 100%; height: auto; }
  .footer { font-family: '仿宋', FangSong; font-size: 10.5pt; margin-top: 30pt; text-align: right; color: #666; }
  @page { size: A4; margin: 2.54cm; }
</style>
</head>
<body>
${docData.title ? `<h1 class="doc-title">${docData.title}</h1>` : ''}
${metaHtml}
${bodyHtml}
</body></html>`;
    },

    /**
     * 导出 PDF（使用浏览器打印功能）
     */
    exportPDF(element, title) {
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(el => el.outerHTML).join('\n');
        const pw = window.open('', '_blank');
        if (!pw) { alert('请允许弹出窗口'); return; }
        pw.document.write(`<!DOCTYPE html>
<html><head><title>${title}</title><meta charset="utf-8">
${styles}
<style>
  @page { size: A4; margin: 20mm; }
  body { background: #fff !important; color: #000 !important;
         font-family: '宋体', SimSun, serif; font-size: 12pt;
         line-height: 1.8; padding: 0 !important; }
  .preview-section { display: block !important; }
  .no-print { display: none !important; }
  * { box-shadow: none !important; text-shadow: none !important;
      background: transparent !important; }
  .doc-title { color: #000 !important; }
  .preview-panel { border: none !important; background: none !important; }
  .preview-content { background: none !important; }
</style></head><body>${element.innerHTML}</body></html>`);
        pw.document.close();
        setTimeout(() => { pw.focus(); pw.print(); }, 500);
    }
};
