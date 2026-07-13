/** Export CSV compatible Excel : UTF-8 BOM, séparateur point-virgule. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => {
    const s = v == null ? '' : String(v)
    return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  const content = [headers, ...rows].map((r) => r.map(escape).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
