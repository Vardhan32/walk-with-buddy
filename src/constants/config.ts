// ====================================================================
// WALK WITH BUDDY - APPLICATION CONFIGURATION
// ====================================================================

export const APP_CONFIG = {
  appName: 'Walk With Buddy',
  tagline: 'Find someone nearby. Connect. Decide what to do together.',
  launchCity: 'Hyderabad, Telangana, India',
  minAge: 18,
  
  // Matching Engine Configurable Weights (Must sum to 1.0)
  matchingWeights: {
    sharedInterests: 0.40,
    proximity: 0.30,
    availability: 0.20,
    walkingPreferences: 0.10,
  },

  // Conversational 5-Factor Scoring Weights (Must sum to 1.0)
  conversationalWeights: {
    sharedInterestsAndActivities: 0.30,
    proximity: 0.25,
    availability: 0.20,
    discoveryAndProfession: 0.15,
    profileCompleteness: 0.10,
  },

  // Hyderabad Localities for Manual Discovery
  hyderabadLocalities: [
    'Hitec City',
    'Madhapur',
    'Jubilee Hills',
    'Banjara Hills',
    'Gachibowli',
    'Kondapur',
    'Financial District',
    'Begumpet',
    'Secunderabad',
    'Kukatpally',
    'Somajiguda',
    'Mehdipatnam',
  ] as const,

  // Conversational Activities Options (Question 2)
  discoveryActivities: [
    { id: 'casual_walk', label: 'Casual walk', icon: 'footsteps-outline' },
    { id: 'coffee_chat', label: 'Coffee and conversation', icon: 'cafe-outline' },
    { id: 'explore_city', label: 'Explore the city', icon: 'map-outline' },
    { id: 'exercise_fitness', label: 'Exercise and fitness', icon: 'fitness-outline' },
    { id: 'talk_ideas', label: 'Talk and exchange ideas', icon: 'chatbubbles-outline' },
    { id: 'learn_something', label: 'Learn something new', icon: 'bulb-outline' },
    { id: 'open_plan', label: 'No particular plan — just meet someone interesting', icon: 'sparkles-outline' },
  ],

  // Popular Professions Catalog (Question 5)
  popularProfessions: [
    'Doctor',
    'Software Engineer',
    'Lawyer',
    'Entrepreneur / Founder',
    'Police Officer / Civil Services',
    'Teacher / Professor',
    'Product Designer',
    'Student',
    'Artist / Creative',
    'Architect',
    'Scientist / Researcher',
    'Financial Analyst',
  ],

  // Discovery Radius Options (km)
  radiusOptions: [1, 2, 5, 10, 15] as const,
  defaultRadiusKm: 5,

  // Location update rate limiting
  minLocationUpdateIntervalMs: 60 * 1000, // 1 minute
  
  // Walking Distance Preferences mapping
  walkingDistances: [
    { id: 'short_1_2km', label: '1 - 2 km (Short stroll)', approxKm: 1.5 },
    { id: 'medium_3_5km', label: '3 - 5 km (Standard walk)', approxKm: 4.0 },
    { id: 'long_5km_plus', label: '5+ km (Long endurance walk)', approxKm: 6.5 },
  ],

  // Walking Pace options
  walkingPaces: [
    { id: 'relaxed', label: 'Relaxed (Casual & easy-going)' },
    { id: 'moderate', label: 'Moderate (Standard conversational pace)' },
    { id: 'brisk', label: 'Brisk (Fast-paced fitness walk)' },
  ],

  // Safety & Guidelines
  safetyTips: [
    'Always schedule your first walk in well-lit, public spaces (e.g. Durgam Cheruvu Lakefront, KBR Park, Necklace Road).',
    'Walk during daylight or busy morning/evening hours.',
    'Tell a friend or family member where you are heading.',
    'Never share private financial information or OTPs.',
    'Walk With Buddy never shares your exact GPS coordinates with other users.',
  ],
};
