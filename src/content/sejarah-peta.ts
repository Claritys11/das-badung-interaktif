// DIGENERATE oleh scripts/sejarah-aset.mjs dari raw/sejarah/kmz/*.kmz. Jangan diedit manual.
export const titikSekarang = [
  { nama: 'Lapangan Puputan Badung (I Gusti Ngurah Made Agung)', lngLat: [115.2176527, -8.6569327] },
  { nama: 'Jaya Sabha', lngLat: [115.2177491, -8.6555094] },
  { nama: 'Patung Catur Muka', lngLat: [115.2169747, -8.6559442] },
] as { nama: string; lngLat: [number, number] }[];
export const titikKerajaan = [
  { nama: 'Ruang terbuka hijau', lngLat: [115.2176527, -8.6569327] },
  { nama: 'Puri Agung Denpasar', lngLat: [115.2177491, -8.6555094] },
  { nama: 'Pasar', lngLat: [115.216645, -8.656137] },
  { nama: 'Wantilan', lngLat: [115.2166521, -8.655642] },
] as { nama: string; lngLat: [number, number] }[];
/** Garis merah tapak dara; tiap garis dimulai dari perempatan lalu menjauh. */
export const garisTapakDara = [
  [
    [115.2170688, -8.6559773],
    [115.218721, -8.6562071],
  ],
  [
    [115.21689, -8.655942],
    [115.2150196, -8.6557051],
  ],
  [
    [115.2169642, -8.6558509],
    [115.2170697, -8.654229],
  ],
  [
    [115.2169526, -8.6560356],
    [115.2167809, -8.6580898],
  ],
] as [number, number][][];
type Sudut = [[number, number], [number, number], [number, number], [number, number]];
export const petaLama = {
  '1915': {
    file: 'peta-1915.jpg',
    sudut: [
      [115.1980421, -8.6367554],
      [115.2250711, -8.6362382],
      [115.2257583, -8.6713351],
      [115.1987293, -8.6718524],
    ],
  } as { file: string; sudut: Sudut },
  '1930': {
    file: 'peta-1930.jpg',
    sudut: [
      [115.2069174, -8.6467613],
      [115.229318, -8.6477954],
      [115.2285465, -8.6641304],
      [115.2061459, -8.6630963],
    ],
  } as { file: string; sudut: Sudut },
};
