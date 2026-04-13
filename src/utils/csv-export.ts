/**
 * CSV Export — generates and downloads CSV from table data.
 * Used client-side via inline script on each page.
 */

export function exportTableToCSV(tableEl: HTMLTableElement, filename: string) {
  const rows: string[][] = [];

  // Headers
  const headers = Array.from(tableEl.querySelectorAll('thead th'))
    .map(th => `"${(th.textContent || '').trim()}"`);
  rows.push(headers);

  // Body
  tableEl.querySelectorAll('tbody tr').forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('td'))
      .map(td => `"${(td.textContent || '').trim().replace(/"/g, '""')}"`);
    rows.push(cells);
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

/** Add export buttons to all .table-section elements on the page */
export function initCSVExport() {
  document.querySelectorAll('.table-section').forEach(section => {
    const header = section.querySelector('.table-header');
    const table = section.querySelector('.data-table') as HTMLTableElement;
    const title = section.querySelector('.table-title')?.textContent?.trim() || 'export';

    if (!header || !table) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'csv-export-btn';
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV`;
    btn.title = `Export ${title} as CSV`;
    btn.addEventListener('click', () => {
      exportTableToCSV(table, title.toLowerCase().replace(/\s+/g, '-'));
    });

    // Insert before source tag
    const sourceTag = header.querySelector('.source-tag');
    if (sourceTag) {
      header.insertBefore(btn, sourceTag);
    } else {
      header.appendChild(btn);
    }
  });
}
