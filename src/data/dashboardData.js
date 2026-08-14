export const navItems = [
  { label: 'Главная', path: '/' },
  { label: 'Темы', path: '/topics' },
  { label: 'Чанки' },
  { label: 'Практика', section: true },
  { label: 'ФИПИ задания', child: true },
  { label: 'Extra Practice', child: true },
  { label: 'Speaking', child: true, path: '/speaking' },
  { label: 'Ошибки' },
  { label: 'Revision' },
  { label: 'Прогресс' },
  { label: 'Настройки' },
]

export const featureCards = [
  {
    title: 'Темы',
    meta: '12 тем',
    action: 'Перейти',
    path: '/topics',
    tone: 'violet',
  },
  {
    title: 'Практика',
    meta: 'ФИПИ и Extra Practice',
    action: 'Перейти',
    tone: 'blue',
  },
  {
    title: 'Speaking',
    meta: 'Тренировка говорения',
    action: 'Перейти',
    path: '/speaking',
    tone: 'mint',
  },
]
