// ====================================================================
// WALK WITH BUDDY - AUTOMATED BUSINESS & SECURITY LOGIC TEST SUITE
// ====================================================================

import { matchingLogic } from '../src/utils/matchingLogic';
import {
  validateCoordinates,
  calculateAge,
  sanitizeProfileUpdates,
  isElevationAttempt,
  projectSafePublicProfile,
  deduplicateMessages,
  PUBLIC_PROFILE_ALLOWLIST,
  PROTECTED_PROFILE_FIELDS,
} from '../src/utils/securityLogic';
import { APP_CONFIG } from '../src/constants/config';
import { Profile, Message } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`  [PASS] ${message} (${JSON.stringify(actual)} === ${JSON.stringify(expected)})`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message} - Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('\n========================================================');
console.log('RUNNING WALK WITH BUDDY AUTOMATED TEST SUITE');
console.log('========================================================\n');

// --------------------------------------------------------------------
// TEST GROUP 1: Configurable Matching Engine Weight Distribution
// --------------------------------------------------------------------
console.log('--- TEST GROUP 1: Matching Engine Weights Verification ---');

const weights = APP_CONFIG.matchingWeights;
const sumWeights =
  weights.sharedInterests +
  weights.proximity +
  weights.availability +
  weights.walkingPreferences;

assertEqual(Math.round(sumWeights * 100) / 100, 1.0, 'Configured weights must sum exactly to 1.0 (100%)');
assertEqual(weights.sharedInterests, 0.40, 'Shared interests weight is 40%');
assertEqual(weights.proximity, 0.30, 'Location proximity weight is 30%');
assertEqual(weights.availability, 0.20, 'Availability overlap weight is 20%');
assertEqual(weights.walkingPreferences, 0.10, 'Walking preferences weight is 10%');

// --------------------------------------------------------------------
// TEST GROUP 2: Mutual Compatibility Score Calculation
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Compatibility Calculation Formula ---');

const baseUser: Partial<Profile> = {
  id: 'u1',
  discovery_radius_km: 10,
  preferred_walking_distance: 'medium_3_5km',
};

const candidateA: Partial<Profile> = {
  id: 'u2',
  preferred_walking_distance: 'medium_3_5km',
};

const candidateB: Partial<Profile> = {
  id: 'u3',
  preferred_walking_distance: 'short_1_2km',
};

// Test 2.1: Maximum match (4+ shared interests, distance 0km, 2+ avail slots, same walking style)
const maxScore = matchingLogic.calculateCompatibility(
  baseUser,
  candidateA,
  4, // shared interests
  0, // distance km
  2  // shared availability slots
);
assertEqual(maxScore, 100, 'Perfect match should score 100%');

// Test 2.2: Walking preference mismatch penalty
const scoreB = matchingLogic.calculateCompatibility(
  baseUser,
  candidateB,
  4,
  0,
  2
);
assert(scoreB < maxScore, 'Walking preference mismatch should result in lower score');
assertEqual(scoreB, 95, 'Score with walking mismatch reflects 10% weight at 50% match');

// Test 2.3: Lower boundary floor (minimum 40%)
const minScore = matchingLogic.calculateCompatibility(
  baseUser,
  candidateB,
  0,  // 0 interests
  20, // out of range distance
  0   // 0 availability
);
assertEqual(minScore, 40, 'Low match score maintains 40% minimum baseline');

// --------------------------------------------------------------------
// TEST GROUP 3: Mutual Gender Preference Compatibility Matrix
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Mutual Gender Compatibility Matrix ---');

// Case 1: Open to all
assert(
  matchingLogic.isGenderCompatible('male', 'all', 'female', 'all'),
  'Male (all) and Female (all) are mutually compatible'
);
assert(
  matchingLogic.isGenderCompatible('non_binary', 'all', 'female', 'all'),
  'Non-binary (all) and Female (all) are mutually compatible'
);

// Case 2: Mutual specific preferences match
assert(
  matchingLogic.isGenderCompatible('male', 'women', 'female', 'men'),
  'Male seeking women and Female seeking men are mutually compatible'
);

// Case 3: One-way preference mismatch (A accepts B, but B does NOT accept A)
assert(
  !matchingLogic.isGenderCompatible('male', 'women', 'female', 'women'),
  'Male seeking women and Female seeking women must NOT match (Female does not accept Men)'
);
assert(
  !matchingLogic.isGenderCompatible('male', 'men', 'female', 'men'),
  'Male seeking men and Female seeking men must NOT match (Male does not accept Women)'
);

// Case 4: Non-binary specific compatibility
assert(
  matchingLogic.isGenderCompatible('non_binary', 'non_binary', 'non_binary', 'non_binary'),
  'Non-binary users seeking non-binary are mutually compatible'
);
assert(
  !matchingLogic.isGenderCompatible('male', 'women', 'non_binary', 'all'),
  'Male seeking women and Non-binary seeking all must NOT match'
);

// --------------------------------------------------------------------
// TEST GROUP 4: Anti-Collision Canonical Match Pair Ordering
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: Race-Condition Safe Match Pair Ordering ---');

const idAlpha = '00000000-0000-0000-0000-000000000001';
const idBeta  = '00000000-0000-0000-0000-000000000002';

const pair1 = matchingLogic.getCanonicalMatchPair(idAlpha, idBeta);
const pair2 = matchingLogic.getCanonicalMatchPair(idBeta, idAlpha);

assertEqual(pair1[0], pair2[0], 'Canonical user1_id matches regardless of order of likes');
assertEqual(pair1[1], pair2[1], 'Canonical user2_id matches regardless of order of likes');
assert(pair1[0] < pair1[1], 'Canonical ordering guarantees user1_id < user2_id for database UNIQUE index');

// --------------------------------------------------------------------
// TEST GROUP 5: Haversine Approximate Proximity Calculation
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Haversine Distance Calculation (Hyderabad) ---');

// Distance between Hitec City (17.4435, 78.3772) and Madhapur (17.4483, 78.3915)
const hitecToMadhapur = matchingLogic.haversineDistance(17.4435, 78.3772, 17.4483, 78.3915);
assert(
  hitecToMadhapur >= 1.0 && hitecToMadhapur <= 2.5,
  `Hitec City to Madhapur distance (~${hitecToMadhapur} km) is within walking range (1 - 2.5 km)`
);

// Distance between Hitec City and Jubilee Hills (17.4319, 78.4073)
const hitecToJubilee = matchingLogic.haversineDistance(17.4435, 78.3772, 17.4319, 78.4073);
assert(
  hitecToJubilee >= 3.0 && hitecToJubilee <= 5.0,
  `Hitec City to Jubilee Hills distance (~${hitecToJubilee} km) is within medium range (3 - 5 km)`
);

// --------------------------------------------------------------------
// TEST GROUP 6: Age Assurance & Verification Logic
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 6: Age Assurance & Verification Logic ---');

const now = new Date();
const adultDob = new Date(now.getFullYear() - 22, now.getMonth(), now.getDate()).toISOString().split('T')[0];
const underageDob = new Date(now.getFullYear() - 17, now.getMonth(), now.getDate()).toISOString().split('T')[0];
const exactly18Dob = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()).toISOString().split('T')[0];
const almost18Dob = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate() + 2).toISOString().split('T')[0];

const adultResult = calculateAge(adultDob);
assert(adultResult.isValid && adultResult.isAdult && adultResult.age === 22, 'Age 22 is valid and recognized as adult');

const underageResult = calculateAge(underageDob);
assert(underageResult.isValid && !underageResult.isAdult && underageResult.age === 17, 'Age 17 is marked as NOT an adult (< 18)');

const exactly18Result = calculateAge(exactly18Dob);
assert(exactly18Result.isValid && exactly18Result.isAdult && exactly18Result.age === 18, 'Age exactly 18 is recognized as eligible adult');

const almost18Result = calculateAge(almost18Dob);
assert(almost18Result.isValid && !almost18Result.isAdult && almost18Result.age === 17, 'Two days before 18th birthday is strictly rejected (< 18)');

const invalidDobResult = calculateAge('not-a-valid-date');
assert(!invalidDobResult.isValid && !invalidDobResult.isAdult, 'Malformed birth date string is rejected');

// --------------------------------------------------------------------
// TEST GROUP 7: Coordinates Bounds Validation
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 7: Geographical Coordinate Bounds Validation ---');

// Valid coordinates
assert(validateCoordinates(17.4435, 78.3772), 'Hyderabad coordinates (17.4435, 78.3772) are valid');
assert(validateCoordinates(0, 0), 'Equator / Prime Meridian (0, 0) is valid');
assert(validateCoordinates(-90, -180), 'Minimum boundary (-90, -180) is valid');
assert(validateCoordinates(90, 180), 'Maximum boundary (90, 180) is valid');

// Out of bounds coordinates
assert(!validateCoordinates(91.0, 78.0), 'Latitude > 90 must be rejected');
assert(!validateCoordinates(-90.5, 78.0), 'Latitude < -90 must be rejected');
assert(!validateCoordinates(17.0, 181.0), 'Longitude > 180 must be rejected');
assert(!validateCoordinates(17.0, -180.1), 'Longitude < -180 must be rejected');
assert(!validateCoordinates(NaN, 78.0), 'NaN latitude must be rejected');
assert(!validateCoordinates(17.0, Infinity), 'Infinity longitude must be rejected');

// --------------------------------------------------------------------
// TEST GROUP 8: Profile Privilege Escalation & Protected Fields
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 8: Profile Privilege Escalation Protection ---');

const honestUpdate = {
  bio: 'Passionate walker exploring tech parks.',
  preferred_activities: ['walking', 'coffee'],
  approx_area: 'Madhapur',
};

const maliciousUpdate = {
  bio: 'Hacker attempting escalation',
  role: 'admin',
  is_profession_verified: true,
  verification_badge_title: 'Chief Security Officer',
  is_suspended: false,
  is_age_verified: true,
  age_assurance_status: 'verified',
  email: 'victim@example.com',
};

assert(!isElevationAttempt(honestUpdate), 'Honest profile update contains no protected fields');
assert(isElevationAttempt(maliciousUpdate), 'Malicious profile update is flagged as privilege escalation attempt');

const sanitizedMalicious = sanitizeProfileUpdates(maliciousUpdate);
for (const field of PROTECTED_PROFILE_FIELDS) {
  assert(
    (sanitizedMalicious as any)[field] === undefined,
    `Protected field '${field}' was stripped from update payload`
  );
}
assertEqual((sanitizedMalicious as any).bio, 'Hacker attempting escalation', 'Permitted non-protected fields are preserved');

// --------------------------------------------------------------------
// TEST GROUP 9: Safe Public Profile Allowlist Projection
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 9: Safe Public Profile Data Isolation ---');

const fullInternalProfile: Record<string, any> = {
  id: '00000000-0000-0000-0000-000000000042',
  email: 'private.user@internal.domain',
  display_name: 'Priya Sharma',
  age: 26,
  date_of_birth: '1998-05-14',
  avatar_url: 'https://cdn.walkwithbuddy.app/avatars/42.jpg',
  latitude: 17.443512345, // Exact GPS coordinate!
  longitude: 78.377254321, // Exact GPS coordinate!
  profession: 'Biotech Analyst',
  is_profession_verified: true,
  verification_badge_title: 'Biotech Analyst',
  role: 'moderator',
  is_suspended: false,
  age_assurance_status: 'verified',
  preferred_activities: ['walking', 'tea'],
  preferred_walking_distance: 'medium_3_5km',
  walking_pace: 'brisk',
  approx_city: 'Hyderabad',
  approx_area: 'Kondapur',
  is_location_visible: true,
  created_at: '2026-01-01T00:00:00Z',
};

const safeProjected = projectSafePublicProfile(fullInternalProfile);

// Explicitly check for PII leakage
assert((safeProjected as any).email === undefined, 'Private email address is NOT present in public projection');
assert((safeProjected as any).latitude === undefined, 'Exact latitude coordinate is NOT present in public projection');
assert((safeProjected as any).longitude === undefined, 'Exact longitude coordinate is NOT present in public projection');
assert((safeProjected as any).date_of_birth === undefined, 'Exact date of birth is NOT present in public projection');
assert((safeProjected as any).role === undefined, 'Internal user role is NOT present in public projection');
assert((safeProjected as any).is_suspended === undefined, 'Suspension status is NOT present in public projection');

// Explicitly verify safe public fields are preserved
assertEqual((safeProjected as any).display_name, 'Priya Sharma', 'Display name is preserved');
assertEqual((safeProjected as any).approx_area, 'Kondapur', 'Approximate area is preserved');
assertEqual((safeProjected as any).profession, 'Biotech Analyst', 'Profession is preserved');
assertEqual((safeProjected as any).is_profession_verified, true, 'Verified status is preserved');

// --------------------------------------------------------------------
// TEST GROUP 10: Message Deduplication & Delivery Integrity
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 10: Chat Message Deduplication ---');

const existingMessages: Partial<Message>[] = [
  { id: 'm1', client_id: 'client-001', content: 'Hey!', sender_id: 'u1' },
  { id: 'm2', client_id: 'client-002', content: 'Want to walk today?', sender_id: 'u1' },
];

const incomingMessages: Partial<Message>[] = [
  // Duplicate by ID (e.g. Realtime echo of message already received)
  { id: 'm2', client_id: 'client-002', content: 'Want to walk today?', sender_id: 'u1' },
  // Duplicate by client_id (optimistic message resolved with server ID)
  { id: 'm3_server_id', client_id: 'client-001', content: 'Hey!', sender_id: 'u1' },
  // Brand new incoming message
  { id: 'm4', client_id: 'client-004', content: 'Sure, let’s meet at Durgam Cheruvu!', sender_id: 'u2' },
];

const deduplicated = deduplicateMessages<Partial<Message>>(existingMessages, incomingMessages);
assertEqual(deduplicated.length, 3, 'Deduplication collapses duplicate server IDs and client IDs (3 distinct messages)');
assertEqual(deduplicated[2].content, 'Sure, let’s meet at Durgam Cheruvu!', 'New incoming message successfully appended');

// --------------------------------------------------------------------
// TEST GROUP 11: Read-Receipt Immutability Contract
// --------------------------------------------------------------------
console.log('\n--- TEST GROUP 11: Read-Receipt RPC Immutability Contract ---');

interface ReadReceiptCall {
  match_id: string;
  caller_id: string;
}

// Simulating the Postgres RPC `mark_messages_read(p_match_id UUID)`
function simulateMarkMessagesReadRpc(
  messagesTable: Array<{ id: string; match_id: string; sender_id: string; is_read: boolean; content: string }>,
  call: ReadReceiptCall
) {
  return messagesTable.map((m) => {
    if (m.match_id === call.match_id && m.sender_id !== call.caller_id && !m.is_read) {
      // ONLY modifies is_read; content, sender_id, match_id are strictly immutable
      return { ...m, is_read: true };
    }
    return m;
  });
}

const tableBefore = [
  { id: 'msg-1', match_id: 'match-xyz', sender_id: 'user-b', is_read: false, content: 'Original Message Content' },
  { id: 'msg-2', match_id: 'match-xyz', sender_id: 'user-a', is_read: false, content: 'My Own Message' },
];

const tableAfter = simulateMarkMessagesReadRpc(tableBefore, { match_id: 'match-xyz', caller_id: 'user-a' });

assertEqual(tableAfter[0].is_read, true, 'Recipient successfully marked incoming message as read');
assertEqual(tableAfter[0].content, 'Original Message Content', 'Message content remains completely unchanged');
assertEqual(tableAfter[0].sender_id, 'user-b', 'Message sender_id remains completely unchanged');
assertEqual(tableAfter[1].is_read, false, 'User cannot mark their own outgoing message as read for the recipient');

console.log('\n========================================================');
console.log(`TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('========================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL BUSINESS & SECURITY LOGIC TESTS PASSED SUCCESSFULLY! [OK]\n');
}
