// ====================================================================
// WALK WITH BUDDY - INTERESTS & ACTIVITIES CATALOG
// ====================================================================

export interface PredefinedInterest {
  id: string;
  name: string;
  category: 'Tech & Career' | 'Health & Active' | 'Culture & Arts' | 'Outdoors & Travel' | 'Lifestyle';
  icon: string;
}

export const PREDEFINED_INTERESTS: PredefinedInterest[] = [
  { id: '1', name: 'Technology', category: 'Tech & Career', icon: 'code' },
  { id: '2', name: 'Startups', category: 'Tech & Career', icon: 'rocket' },
  { id: '3', name: 'Entrepreneurship', category: 'Tech & Career', icon: 'briefcase' },
  { id: '4', name: 'Business', category: 'Tech & Career', icon: 'trending-up' },
  { id: '5', name: 'Design', category: 'Tech & Career', icon: 'layout' },
  { id: '6', name: 'Science', category: 'Tech & Career', icon: 'compass' },
  { id: '7', name: 'Fitness', category: 'Health & Active', icon: 'activity' },
  { id: '8', name: 'Sports', category: 'Health & Active', icon: 'award' },
  { id: '9', name: 'Nature', category: 'Outdoors & Travel', icon: 'sun' },
  { id: '10', name: 'Travel', category: 'Outdoors & Travel', icon: 'map-pin' },
  { id: '11', name: 'Photography', category: 'Culture & Arts', icon: 'camera' },
  { id: '12', name: 'Art', category: 'Culture & Arts', icon: 'feather' },
  { id: '13', name: 'Movies', category: 'Culture & Arts', icon: 'film' },
  { id: '14', name: 'Music', category: 'Culture & Arts', icon: 'music' },
  { id: '15', name: 'Gaming', category: 'Lifestyle', icon: 'tv' },
  { id: '16', name: 'Books', category: 'Culture & Arts', icon: 'book-open' },
  { id: '17', name: 'Philosophy', category: 'Culture & Arts', icon: 'smile' },
  { id: '18', name: 'Food', category: 'Lifestyle', icon: 'coffee' },
  { id: '19', name: 'Education', category: 'Tech & Career', icon: 'book' },
  { id: '20', name: 'Learning', category: 'Tech & Career', icon: 'globe' },
];

export const PREFERRED_ACTIVITIES = [
  { id: 'morning_walk', label: 'Morning Walk', icon: 'sunrise' },
  { id: 'evening_stroll', label: 'Evening Stroll', icon: 'sunset' },
  { id: 'coffee_chat', label: 'Coffee & Conversation', icon: 'coffee' },
  { id: 'weekend_trek', label: 'Weekend Trek / Hike', icon: 'map' },
  { id: 'tech_talk', label: 'Tech & Startup Brainstorm', icon: 'cpu' },
  { id: 'photo_walk', label: 'Street Photography Walk', icon: 'camera' },
  { id: 'fitness_jog', label: 'Fitness Jog / Brisk Walk', icon: 'activity' },
  { id: 'book_discussion', label: 'Book & Philosophy Walk', icon: 'book' },
  { id: 'explore_city', label: 'Neighbourhood Exploration', icon: 'compass' },
];

export const HYDERABAD_AREAS = [
  'Hitec City',
  'Gachibowli',
  'Madhapur',
  'Jubilee Hills',
  'Banjara Hills',
  'Kondapur',
  'Kukatpally',
  'Durgam Cheruvu',
  'Financial District',
  'Begumpet',
  'Secunderabad',
  'Tank Bund & Hussain Sagar',
];

export const PROFESSIONAL_TITLES = [
  'Software Engineer',
  'Product Manager',
  'Founder / Entrepreneur',
  'UI/UX Designer',
  'Data Scientist',
  'Doctor / Healthcare',
  'Architect / Civil',
  'Lawyer / Legal',
  'Chartered Accountant',
  'Student / Researcher',
  'Educator / Professor',
  'Marketer / Growth',
  'Civil Servant / Police',
  'Writer / Journalist',
  'Other',
];
