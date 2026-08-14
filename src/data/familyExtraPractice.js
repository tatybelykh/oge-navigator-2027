import { familyContentPackMaterials } from './familyContentPack'
import { familyTask1Texts } from './speaking/familyTask1Texts'
import { familyTask2Sets } from './speaking/familyTask2Sets'
import { familyTask3Sets } from './speaking/familyTask3Sets'

export const familyExtraPractice = [
  ...familyContentPackMaterials.map((material) => ({
    ...material,
    tags: ['family', material.taskType, 'original-practice'],
    progressSection: material.section === 'Chunks' ? 'Speaking' : material.section,
  })),
  ...familyTask1Texts.map((text) => ({
    ...text,
    section: 'Extra Practice',
    source: 'OGE Navigator',
    tags: ['family', 'speaking-task-1', 'exam-style'],
    progressSection: 'Speaking',
  })),
  ...familyTask2Sets.map((set) => ({
    ...set,
    section: 'Extra Practice',
    source: 'OGE Navigator',
    tags: ['family', 'speaking-task-2', 'exam-style'],
    progressSection: 'Speaking',
  })),
  ...familyTask3Sets.map((set) => ({
    ...set,
    section: 'Extra Practice',
    source: 'OGE Navigator',
    tags: ['family', 'speaking-task-3', 'exam-style'],
    progressSection: 'Speaking',
  })),
]
