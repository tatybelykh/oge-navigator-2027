export const fipiSectionFilters = [
  'All',
  'Listening',
  'Reading',
  'Grammar & Vocabulary',
  'Writing',
  'Speaking',
]

export const officialFipiResources = [
  ['Listening', 'https://doc.fipi.ru/navigator-podgotovki/navigator-oge/aja-9_1_audirovanie.pdf'],
  ['Reading', 'https://doc.fipi.ru/navigator-podgotovki/navigator-oge/aja-9_2_chtenie.pdf'],
  ['Grammar & Vocabulary', 'https://doc.fipi.ru/navigator-podgotovki/navigator-oge/aja-9_3_grammatika.pdf'],
  ['Writing', 'https://doc.fipi.ru/navigator-podgotovki/navigator-oge/aja-9_4_pismo.pdf'],
  ['Speaking', 'https://doc.fipi.ru/navigator-podgotovki/navigator-oge/aja-9_5_govorenie.pdf'],
  ['Training variants', 'https://doc.fipi.ru/navigator-podgotovki/navigator-oge/aja-9_tren.pdf'],
].map(([section, url]) => ({
  id: `fipi-2026-${section.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and')}`,
  label: 'Official FIPI',
  year: '2026',
  section,
  url,
}))
