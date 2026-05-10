/**
 * 导出工具 - Word 和 PDF 导出
 */
const ExportUtils = {
    exportWord(contentHtml, title) {
        const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: '宋体', SimSun, serif; font-size: 12pt; line-height: 1.8; padding: 40px; }
  h1 { font-family: '黑体', SimHei, sans-serif; font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
  h2 { font-family: '黑体', SimHei; font-size: 14pt; font-weight: bold; margin: 16px 0 8px; }
  h3 { font-family: '黑体', SimHei; font-size: 13pt; font-weight: bold; margin: 12px 0 6px; }
  .doc-title { font-family: '黑体', SimHei; font-size: 18pt; font-weight: bold; text-align: center; margin: 20px 0; }
  .doc-meta { font-family: '仿宋', FangSong; font-size: 12pt; line-height: 2; }
  .doc-divider { border-top: 1px solid #000; margin: 12px 0; }
  .doc-content { font-family: '仿宋', FangSong; font-size: 12pt; line-height: 1.8; }
  .doc-footer { font-family: '仿宋', FangSong; font-size: 10.5pt; margin-top: 30px; text-align: right; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #000; padding: 6px 10px; font-size: 12pt; }
  th { font-family: '黑体', SimHei; background: #f0f0f0; }
  img { max-width: 100%; height: auto; margin: 8px 0; }
  .doc-images { margin: 16px 0; text-align: center; }
  .doc-image-item { margin: 16px 0; }
  .doc-image-name { font-size: 9pt; color: #666; margin-top: 4px; }
</style></head><body>${contentHtml}</body></html>`;

        const blob = new Blob(['﻿' + fullHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    exportPDF(element, title) {
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(el => el.outerHTML).join('\n');
        const pw = window.open('', '_blank');
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
</style></head><body>${element.innerHTML}</body></html>`);
        pw.document.close();
        setTimeout(() => { pw.focus(); pw.print(); }, 400);
    }
};
