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
