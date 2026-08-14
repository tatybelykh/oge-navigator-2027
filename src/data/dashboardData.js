export const navItems = [
  { label: 'Главная', path: '/' },
  { label: 'Темы', path: '/topics' },
  { label: 'Чанки' },
  { label: 'Практика', section: true },
  { label: 'ФИПИ задания', child: true },
  { label: 'Extra Practice', child: true },
  { label: 'Speaking', child: true },
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
    tone: 'mint',
  },
]

export const progressSummary = {
  overall: 72,
  skills: [
    { label: 'Reading', value: 78 },
    { label: 'Listening', value: 65 },
    { label: 'Grammar', value: 70 },
    { label: 'Writing', value: 60 },
    { label: 'Speaking', value: 75 },
  ],
}

export const recentTasks = [
  { type: 'Reading', title: 'Text with gaps', result: '80%' },
  { type: 'Speaking Task 3', title: 'Family', result: '6/7' },
  { type: 'Grammar', title: 'Word formation', result: '90%' },
]

export const activeChunks = [
  { phrase: 'get on well with', progress: 86 },
  { phrase: 'have a lot in common', progress: 72 },
  { phrase: 'spend time together', progress: 68 },
  { phrase: 'be close to somebody', progress: 61 },
  { phrase: 'fall out with', progress: 48 },
]

export const revisionCard = {
  count: 7,
  label: 'элементов',
}
