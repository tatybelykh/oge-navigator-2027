export const familyTask1Texts = [
  {
    id: 'speaking-task-1-family-traditions',
    slug: 'family-traditions',
    title: 'Family Traditions',
    description: 'An exam-style reading aloud text about family traditions.',
    text: `Families often have traditions that make their time together special.
Some traditions are connected with holidays, while others are part of everyday life.
For example, family members may have dinner together every Sunday or visit their grandparents at weekends.
Small traditions can be important because they give people a feeling of stability and belonging.
They also create memories that children may keep for many years.
However, traditions can change when children grow older or family members move to different places.
Modern technology helps relatives stay in touch even when they live far apart.
Video calls, family chats and shared photographs can make communication easier.
The most important thing is not the tradition itself but the time people choose to spend together.`,
    topicId: 'family',
    difficulty: 'Medium',
    sourceType: 'extra',
    taskType: 'speaking-task-1',
    section: 'Speaking',
  },
  {
    id: 'speaking-task-1-brothers-and-sisters',
    slug: 'brothers-and-sisters',
    title: 'Brothers and Sisters',
    description: 'An exam-style reading aloud text about brothers and sisters.',
    text: `Having a brother or sister can influence a person's childhood in many ways.
Brothers and sisters often spend a great deal of time together, especially when they are young.
They may play the same games, share family experiences and learn how to solve disagreements.
Of course, they do not always get on well.
Arguments about personal space, household duties or borrowed things are quite common.
At the same time, brothers and sisters can become an important source of support.
An older child may help a younger one with schoolwork or give advice about difficult situations.
As people grow older, their relationship often changes.
Even if they live in different cities, many brothers and sisters continue to keep in touch and support each other.`,
    topicId: 'family',
    difficulty: 'Medium',
    sourceType: 'extra',
    taskType: 'speaking-task-1',
    section: 'Speaking',
  },
  {
    id: 'speaking-task-1-keeping-in-touch',
    slug: 'keeping-in-touch',
    title: 'Keeping in Touch',
    description: 'An exam-style reading aloud text about keeping in touch with relatives.',
    text: `People today have more ways to keep in touch with relatives than ever before.
A hundred years ago, family members who moved abroad usually communicated by letter.
A message could take several weeks to arrive.
Today, people can send photographs, voice messages and videos in a few seconds.
In 2025, millions of families around the world used video calls regularly.
Technology is especially useful when grandparents, parents and children live in different countries.
However, online communication cannot completely replace spending time together face to face.
A short message is convenient, but a real conversation often feels more personal.
For this reason, many families try to combine digital communication with visits, celebrations and shared activities whenever possible.`,
    topicId: 'family',
    difficulty: 'Medium',
    sourceType: 'extra',
    taskType: 'speaking-task-1',
    section: 'Speaking',
  },
]

export function getSpeakingTask1Text(textId) {
  return familyTask1Texts.find((text) => text.id === textId) ?? familyTask1Texts[0]
}
