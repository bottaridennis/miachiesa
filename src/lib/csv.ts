export function downloadCSV(filename: string, rows: (string | number | boolean | undefined | null)[][]) {
  const escape = (v: unknown) => {
    const s = v === undefined || v === null ? '' : typeof v === 'boolean' ? (v ? 'Sì' : 'No') : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // ";" come separatore + BOM: Excel in italiano apre il file correttamente
  const csv = '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
