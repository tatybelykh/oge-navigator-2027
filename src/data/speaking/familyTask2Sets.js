export const familyTask2Sets = [
  {
    id: 'speaking-task-2-family-life',
    topicId: 'family',
    title: 'Family Life',
    description: 'Six exam-style questions about everyday family life.',
    difficulty: 'Medium',
    sourceType: 'extra',
    taskType: 'speaking-task-2',
    targetChunks: [
      'spend time together',
      'turn to somebody for advice',
      'take care of somebody',
      'argue about something',
    ],
    questions: [
      { id: 'family-life-q1', text: 'How many people are there in your family?' },
      { id: 'family-life-q2', text: 'What do you usually enjoy doing together?' },
      { id: 'family-life-q3', text: 'Who do you usually turn to when you need advice?' },
      { id: 'family-life-q4', text: 'What household duties do you usually have?' },
      { id: 'family-life-q5', text: 'What can sometimes cause arguments in a family?' },
      { id: 'family-life-q6', text: 'What makes a family happy, in your opinion?' },
    ],
  },
  {
    id: 'speaking-task-2-parents-teenagers',
    topicId: 'family',
    title: 'Parents and Teenagers',
    description: 'Six exam-style questions about parents, teenagers and responsibilities.',
    difficulty: 'Medium',
    sourceType: 'extra',
    taskType: 'speaking-task-2',
    targetChunks: [
      'get on well with somebody',
      'have a good relationship with',
      'support each other',
      'fall out with somebody',
    ],
    questions: [
      { id: 'parents-teenagers-q1', text: 'How often do you spend time with your parents?' },
      { id: 'parents-teenagers-q2', text: 'What do you usually talk to your parents about?' },
      { id: 'parents-teenagers-q3', text: 'What do parents usually help teenagers with?' },
      { id: 'parents-teenagers-q4', text: 'Why do teenagers sometimes disagree with their parents?' },
      { id: 'parents-teenagers-q5', text: 'Do you think teenagers should have household responsibilities? Why?' },
      {
        id: 'parents-teenagers-q6',
        text: 'What would you recommend to parents who want to have a good relationship with their teenage children?',
      },
    ],
  },
  {
    id: 'speaking-task-2-friends-relationships',
    topicId: 'family',
    title: 'Friends and Relationships',
    description: 'Six exam-style questions about friends and relationships.',
    difficulty: 'Medium',
    sourceType: 'extra',
    taskType: 'speaking-task-2',
    targetChunks: [
      'be close to somebody',
      'have a lot in common',
      'spend time together',
      'keep in touch with somebody',
    ],
    questions: [
      { id: 'friends-relationships-q1', text: 'How many close friends do you have?' },
      { id: 'friends-relationships-q2', text: 'What qualities do you value most in a friend?' },
      { id: 'friends-relationships-q3', text: 'What do you and your friends have in common?' },
      { id: 'friends-relationships-q4', text: 'How do you usually spend time together?' },
      { id: 'friends-relationships-q5', text: 'Why do friends sometimes fall out with each other?' },
      { id: 'friends-relationships-q6', text: 'What would you recommend to someone who wants to make new friends?' },
    ],
  },
]

export function getSpeakingTask2Set(setId) {
  return familyTask2Sets.find((set) => set.id === setId) ?? familyTask2Sets[0]
}
