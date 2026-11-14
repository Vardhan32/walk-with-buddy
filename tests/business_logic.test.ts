// ====================================================================
// WALK WITH BUDDY - AUTOMATED BUSINESS LOGIC TEST SUITE
// ====================================================================

import { matchingLogic } from '../src/utils/matchingLogic';
import { APP_CONFIG } from '../src/constants/config';
import { Profile } from '../src/types';

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
console.log('RUNNING WALK WITH BUDDY AUTOMATED BUSINESS LOGIC TESTS');
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

console.log('\n========================================================');
console.log(`TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('========================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL BUSINESS LOGIC TESTS PASSED SUCCESSFULLY! [OK]\n');
}
