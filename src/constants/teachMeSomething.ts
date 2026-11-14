// ====================================================================
// WALK WITH BUDDY - "TEACH ME SOMETHING" PROMPTS & TOPICS
// ====================================================================

export interface TeachMePrompt {
  id: string;
  title: string;
  subtitle: string;
  messageText: string;
  icon: string;
}

export const TEACH_ME_PROMPTS: TeachMePrompt[] = [
  {
    id: 'teach-profession',
    title: 'Your Profession',
    subtitle: 'Share an insider insight from your daily work',
    messageText: "💡 Teach Me Something: What's one fascinating concept, tool, or secret from your profession that people outside your field rarely know?",
    icon: 'briefcase-outline',
  },
  {
    id: 'teach-fact',
    title: 'Interesting Fact',
    subtitle: 'Share a mind-bending or surprising trivia',
    messageText: "🧠 Teach Me Something: What is a random or mind-bending fact that completely blew your mind when you first heard it?",
    icon: 'bulb-outline',
  },
  {
    id: 'teach-hobby',
    title: 'Hobby & Passion',
    subtitle: 'Explain a craft or interest you love',
    messageText: "🎨 Teach Me Something: Tell me about one of your favorite hobbies or crafts — how did you get started, and what makes it special?",
    icon: 'color-palette-outline',
  },
  {
    id: 'teach-skill',
    title: 'Skill in Progress',
    subtitle: 'Share something new you are currently learning',
    messageText: "🚀 Teach Me Something: What is a new skill, habit, or topic you're currently learning or trying to get better at?",
    icon: 'trending-up-outline',
  },
  {
    id: 'teach-hyderabad',
    title: 'Hyderabad Secret',
    subtitle: 'Teach me about a lesser-known city lore or spot',
    messageText: "🏛️ Teach Me Something: What is an intriguing piece of Hyderabad history, architecture, or city culture that most locals don't know?",
    icon: 'map-outline',
  },
];
