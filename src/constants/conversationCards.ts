// ====================================================================
// WALK WITH BUDDY - CONVERSATION CARDS & ICEBREAKER QUESTIONS
// ====================================================================

import { ConversationCard, CardCategory } from '../types';

export const CARD_CATEGORIES: { id: CardCategory; label: string; icon: string }[] = [
  { id: 'icebreakers', label: 'Icebreakers', icon: 'sparkles-outline' },
  { id: 'funny', label: 'Funny & Lighthearted', icon: 'happy-outline' },
  { id: 'career', label: 'Career & Profession', icon: 'briefcase-outline' },
  { id: 'life', label: 'Life Experiences', icon: 'compass-outline' },
  { id: 'hobbies', label: 'Hobbies & Passions', icon: 'color-palette-outline' },
  { id: 'deep', label: 'Deep Conversations', icon: 'chatbubbles-outline' },
  { id: 'hyderabad', label: 'Hyderabad Discoveries', icon: 'map-outline' },
];

export const CONVERSATION_CARDS: ConversationCard[] = [
  // 1. Icebreakers
  {
    id: 'card-ice-1',
    category: 'icebreakers',
    categoryLabel: 'Icebreakers',
    question: "What's something you've always wanted to learn, but haven't found the time for yet?",
  },
  {
    id: 'card-ice-2',
    category: 'icebreakers',
    categoryLabel: 'Icebreakers',
    question: 'If you had a completely free Saturday with no phone or laptop, how would you spend it?',
  },
  {
    id: 'card-ice-3',
    category: 'icebreakers',
    categoryLabel: 'Icebreakers',
    question: "What's the best podcast, video, or book you've encountered recently?",
  },
  {
    id: 'card-ice-4',
    category: 'icebreakers',
    categoryLabel: 'Icebreakers',
    question: 'Are you more of an early morning walker or a sunset / late-evening stroller?',
  },

  // 2. Funny & Lighthearted
  {
    id: 'card-fun-1',
    category: 'funny',
    categoryLabel: 'Funny & Lighthearted',
    question: "What's an irrational or unusual pet peeve you secretly hold?",
  },
  {
    id: 'card-fun-2',
    category: 'funny',
    categoryLabel: 'Funny & Lighthearted',
    question: "If you were forced to eat only one Hyderabad food item for a whole month, what would it be?",
  },
  {
    id: 'card-fun-3',
    category: 'funny',
    categoryLabel: 'Funny & Lighthearted',
    question: "What's the funniest or most ridiculous trend you ever participated in as a teenager?",
  },
  {
    id: 'card-fun-4',
    category: 'funny',
    categoryLabel: 'Funny & Lighthearted',
    question: 'What is a piece of trivial knowledge you know that practically nobody else cares about?',
  },

  // 3. Career & Profession
  {
    id: 'card-car-1',
    category: 'career',
    categoryLabel: 'Career & Profession',
    question: 'What is one thing people commonly misunderstand about your profession or day-to-day work?',
  },
  {
    id: 'card-car-2',
    category: 'career',
    categoryLabel: 'Career & Profession',
    question: 'If you could spend a full day shadowing anyone in any profession, who would it be?',
  },
  {
    id: 'card-car-3',
    category: 'career',
    categoryLabel: 'Career & Profession',
    question: 'What is the most rewarding or surprising project you ever worked on?',
  },
  {
    id: 'card-car-4',
    category: 'career',
    categoryLabel: 'Career & Profession',
    question: 'If you had to switch to a completely unrelated career tomorrow, what would you try?',
  },

  // 4. Life Experiences
  {
    id: 'card-life-1',
    category: 'life',
    categoryLabel: 'Life Experiences',
    question: "What's the most unexpected adventure or serendipitous experience you've ever had?",
  },
  {
    id: 'card-life-2',
    category: 'life',
    categoryLabel: 'Life Experiences',
    question: 'What is one piece of advice you were given that genuinely shifted your trajectory?',
  },
  {
    id: 'card-life-3',
    category: 'life',
    categoryLabel: 'Life Experiences',
    question: 'What is a place you traveled to that completely defied your expectations?',
  },
  {
    id: 'card-life-4',
    category: 'life',
    categoryLabel: 'Life Experiences',
    question: "What's something you used to care deeply about that doesn't matter to you anymore?",
  },

  // 5. Hobbies & Passions
  {
    id: 'card-hob-1',
    category: 'hobbies',
    categoryLabel: 'Hobbies & Passions',
    question: "What's a hobby or niche topic you could talk about for an hour without preparation?",
  },
  {
    id: 'card-hob-2',
    category: 'hobbies',
    categoryLabel: 'Hobbies & Passions',
    question: 'What music or ambient sounds do you listen to when you want to focus or unwind?',
  },
  {
    id: 'card-hob-3',
    category: 'hobbies',
    categoryLabel: 'Hobbies & Passions',
    question: 'What is a physical activity or sport you find meditative or energizing?',
  },

  // 6. Deep Conversations
  {
    id: 'card-deep-1',
    category: 'deep',
    categoryLabel: 'Deep Conversations',
    question: 'What is an unusual or controversial opinion you hold that most people disagree with?',
  },
  {
    id: 'card-deep-2',
    category: 'deep',
    categoryLabel: 'Deep Conversations',
    question: 'What does a truly meaningful and satisfying day look like to you?',
  },
  {
    id: 'card-deep-3',
    category: 'deep',
    categoryLabel: 'Deep Conversations',
    question: 'What is something you find yourself re-evaluating about life or success as you grow older?',
  },
  {
    id: 'card-deep-4',
    category: 'deep',
    categoryLabel: 'Deep Conversations',
    question: 'If you could know the absolute, objective truth to any one question, what would you ask?',
  },

  // 7. Hyderabad Discoveries
  {
    id: 'card-hyd-1',
    category: 'hyderabad',
    categoryLabel: 'Hyderabad Discoveries',
    question: "What's your absolute favorite hidden gem or walking spot in Hyderabad that few people know about?",
  },
  {
    id: 'card-hyd-2',
    category: 'hyderabad',
    categoryLabel: 'Hyderabad Discoveries',
    question: 'Irani chai with Osmania biscuit vs artisan specialty pour-over coffee — which is your vibe?',
  },
  {
    id: 'card-hyd-3',
    category: 'hyderabad',
    categoryLabel: 'Hyderabad Discoveries',
    question: "What's the best memory or evening walk you've had in Hyderabad so far?",
  },
  {
    id: 'card-hyd-4',
    category: 'hyderabad',
    categoryLabel: 'Hyderabad Discoveries',
    question: "If you had to show a first-time visitor one place that captures the soul of Hyderabad, where would you take them?",
  },
];
