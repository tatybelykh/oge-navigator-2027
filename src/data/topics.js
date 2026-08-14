export const topics = [
  {
    id: 'family',
    slug: 'family-relationships',
    title: 'Family & Relationships',
    description: 'Family, friends, relationships and conflicts',
    icon: 'FR',
  },
  {
    id: 'appearance',
    slug: 'appearance-personality',
    title: 'Appearance & Personality',
    description: 'Appearance, character and personality',
    icon: 'AP',
  },
  {
    id: 'free-time',
    slug: 'free-time-hobbies',
    title: 'Free Time & Hobbies',
    description: 'Hobbies, books, films, games and sport',
    icon: 'FH',
  },
  {
    id: 'health',
    slug: 'health-lifestyle',
    title: 'Health & Lifestyle',
    description: 'Health, habits and healthy lifestyle',
    icon: 'HL',
  },
  {
    id: 'shopping',
    slug: 'shopping-money-fashion',
    title: 'Shopping, Money & Fashion',
    description: 'Shopping, pocket money, clothes and fashion',
    icon: 'SM',
  },
  {
    id: 'school',
    slug: 'school-education',
    title: 'School & Education',
    description: 'School life, subjects and education',
    icon: 'SE',
  },
  {
    id: 'jobs',
    slug: 'jobs-future-plans',
    title: 'Jobs & Future Plans',
    description: 'Jobs, professions and future career',
    icon: 'JP',
  },
  {
    id: 'travel',
    slug: 'travel-transport',
    title: 'Travel & Transport',
    description: 'Holidays, travelling and transport',
    icon: 'TT',
  },
  {
    id: 'nature',
    slug: 'nature-environment',
    title: 'Nature & Environment',
    description: 'Nature, animals and environmental issues',
    icon: 'NE',
  },
  {
    id: 'media',
    slug: 'media-internet-technology',
    title: 'Media, Internet & Technology',
    description: 'Media, Internet, communication and technology',
    icon: 'MT',
  },
  {
    id: 'culture',
    slug: 'countries-culture',
    title: 'Countries & Culture',
    description: 'Countries, languages, traditions and culture',
    icon: 'CC',
  },
  {
    id: 'people',
    slug: 'outstanding-people',
    title: 'Outstanding People',
    description: 'Famous people and achievements',
    icon: 'OP',
  },
]

export const getTopicBySlug = (slug) =>
  topics.find((topic) => topic.slug === slug)
