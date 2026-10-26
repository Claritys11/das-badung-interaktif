/**
 * Teks redaksi dengan penanda miring: `_IDN Times_` → <em>IDN Times</em>
 * (nama media, istilah asing). Selain itu teks tampil apa adanya — tidak ada HTML mentah.
 */
export function TeksInline({ teks }: { teks: string }) {
  return <>{teks.split(/_([^_]+)_/).map((s, i) => (i % 2 ? <em key={i}>{s}</em> : s))}</>;
}
