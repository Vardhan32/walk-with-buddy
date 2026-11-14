# Walk With Buddy 🚶‍♂️🤝

> *"Find someone nearby. Connect. Decide what to do together."*

**Walk With Buddy** is a modern, Android-first social discovery platform launching in **Hyderabad, Telangana, India**. It helps adults (18+) discover interesting people nearby, connect through shared interests, and choose whether they want to walk, explore trails, talk tech & startups, exercise, or spend meaningful time together outdoors.

---

## 📋 Progress Checklist

- [x] **Project Scaffolding**: React Native + Expo SDK 58 + TypeScript + Expo Router.
- [x] **Design System**: Light & Dark themes, typography scale, responsive layout, reusable buttons, cards, avatars, badges, and modals.
- [x] **All 24 Required Screens Connected**:
  1. `app/index.tsx` (Splash screen & route orchestrator)
  2. `app/welcome.tsx` (Welcome value proposition)
  3. `app/onboarding/index.tsx` (Onboarding carousel)
  4. `app/auth/register.tsx` (Registration with 18+ age assurance & gender preferences)
  5. `app/auth/login.tsx` (Login with persistent auth session & Demo mode)
  6. `app/auth/forgot-password.tsx` (Password reset flow)
  7. `app/onboarding/interests.tsx` (Searchable interest-selection catalog)
  8. `app/onboarding/profile-setup.tsx` (Profile creation & walking style)
  9. `app/onboarding/location-permission.tsx` (Location permission & approximate Hyderabad area)
  10. `app/(tabs)/index.tsx` (Home / Smart Matching Engine discovery cards)
  11. `app/(tabs)/nearby.tsx` (Nearby people grid with distance filter)
  12. `app/profile/[id].tsx` (Detailed buddy profile with compatibility breakdown)
  13. Like / Matching interaction (Interactive like, pass, and swipe buttons)
  14. `app/match/celebration.tsx` (Mutual match confirmation screen)
  15. `app/(tabs)/matches.tsx` (Active matches list with unread counters)
  16. `app/chat/[matchId].tsx` (Private 1-to-1 real-time chat with walk suggestions)
  17. `app/profile/edit.tsx` (Edit profile, walking distance, bio, and avatar)
  18. `app/(tabs)/settings.tsx` (Account settings, theme toggle, and safety menu)
  19. `app/settings/privacy.tsx` (Privacy settings & distance visibility)
  20. `app/safety/block-list.tsx` (Blocked users list & unblocking)
  21. `app/safety/report/[userId].tsx` (Report user with categories & descriptions)
  22. `app/verification/request.tsx` (Professional identity verification request)
  23. `app/safety/guidelines.tsx` (Hyderabad safety guidelines & public walking spots)
  24. `app/settings/delete-account.tsx` (Permanent account erasure with CASCADE)
  25. `app/admin/index.tsx` (Admin dashboard), `app/admin/reports.tsx` (Reports review & suspension), `app/admin/verifications.tsx` (Badge approval & review)
- [x] **Database & SQL Migration**: Complete migration script in `supabase/migrations/20261114000000_walk_with_buddy_schema.sql` with tables, triggers, indexes, RLS policies, and secure RPC functions.
- [x] **Matching Engine**: Configurable 4-factor scoring algorithm (Shared Interests 40%, Proximity 30%, Availability 20%, Walking 10%) with mutual gender preference enforcement.
- [x] **Mutual Matching & Anti-Collision**: Unique constraint `CHECK (user1_id < user2_id)` preventing duplicate matches and race conditions.
- [x] **Real-Time Chat**: Configured for Supabase Realtime with optimistic UI updates and instant delivery.
- [x] **GPS & Location Privacy**: Coarse location, approximate distance only (km), exact GPS coordinates never revealed.
- [x] **Automated Tests**: Comprehensive test suite (`npm test`) validating matching engine calculations, gender matrices, canonical ordering, and Haversine distance.
- [x] **Zero TypeScript Errors**: Passes `npx tsc --noEmit` cleanly.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React Native, Expo (SDK 58), TypeScript, Expo Router |
| **Backend & DB** | Supabase, PostgreSQL, Row Level Security (RLS), Supabase Realtime |
| **Location** | Expo Location (Coarse accuracy, reverse geocoding, approximate distance) |
| **Storage** | Supabase Storage (`avatars` bucket) |
| **Testing** | Node test suite via `tsx`, TypeScript compiler (`tsc`) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ or v24+
- **npm**: v9+
- **Expo Go App**: Install from Google Play Store on your Android device (or Android Emulator).

### 2. Installation
```bash
# Clone or navigate to the project directory
cd walk-with-buddy

# Install dependencies (respects legacy peer deps configured in .npmrc)
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
```

> **Note**: You can run and test the complete application immediately in **Demo Mode** even before creating a Supabase project!

---

## 🗄️ Supabase Backend Setup

1. Create a new free project at [database.new](https://database.new).
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Open `supabase/migrations/20261114000000_walk_with_buddy_schema.sql` from this repository.
4. Copy and paste the entire script and click **Run**.
5. Enable Realtime:
   - Navigate to **Database** -> **Replication**.
   - Verify `messages` and `matches` tables are enabled in `supabase_realtime` publication.
6. Create an **Avatars** Storage Bucket:
   - Navigate to **Storage** -> **New Bucket**.
   - Name: `avatars`. Set bucket to **Public**.

---

## 🧪 Running Automated Tests

Run the business logic and matching engine test suite:
```bash
npm test
```
Run strict TypeScript type checks:
```bash
npm run typecheck
```

---

## 📱 Running on Android

### Using Expo Go (Quickest for Development):
```bash
npm start
```
1. Open the **Expo Go** app on your Android device.
2. Scan the QR code displayed in your terminal.
3. The app will bundle and load instantly!

### Building a Standalone Android APK / AAB (EAS Build):
```bash
# 1. Install EAS CLI globally if not already installed
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Configure EAS Build
eas build:configure

# 4. Build Android APK for testing
eas build --platform android --profile preview

# 5. Build Android App Bundle (AAB) for Google Play Store release
eas build --platform android --profile production
```

---

## 🛡️ Safety & Community Moderation

1. **Public Meeting Spots**: The app highlights premier Hyderabad walking locations:
   - *Durgam Cheruvu Lakefront Boardwalk (Madhapur)*
   - *KBR National Park Perimeter Trail (Jubilee Hills)*
   - *Necklace Road & Tank Bund (Hussain Sagar)*
   - *Pala Pitta Walking Track (Kondapur)*
2. **Identity Verification**: Professional badges (e.g. Doctor, Software Engineer, Lawyer) require admin review and cannot be self-awarded.
3. **No Exact Coordinates**: Coordinates are kept secure in database columns; candidates only ever see rounded distances (e.g. `~2.4 km away`).
4. **Instant Block & Report**: Blocking a user immediately deactivates matches and prevents any future communication or discovery.
5. **Emergency Contacts**: One-tap access to Hyderabad Police (100) and She Teams (9490616555).

## 🌟 Conversational Discovery & Smart Matching (`feature/conversational-discovery`)

The platform features an intelligent, conversational discovery experience:

### 1. Conversational Discovery Assistant (Home Screen)
- **Interactive Discovery Modes**:
  1. **Surprise Me**: Diversity-first serendipitous matching with high compatibility.
  2. **Similar Interests**: Finds buddies with overlapping hobbies, tech stacks, and topics.
  3. **Someone From a Profession**: Filter by Doctor, Software Engineer, Lawyer, Founder, etc. (with verified badges).
  4. **Someone Different From Me**: Broaden your horizon with buddies from different walks of life.
  5. **Group Walks**: Small community walks (3-6 buddies) around Hyderabad parks and boardwalks.
- **6-Step Conversational Questionnaire (`app/discovery/guide.tsx`)**:
  - Step 1: Location (GPS vs manual locality like Madhapur, Jubilee Hills, Gachibowli) & Radius (1-15 km).
  - Step 2: What's the plan? (Casual walk, coffee chat, city exploration, fitness jog).
  - Step 3: When? (Right now, next few hours, today, tomorrow, scheduled).
  - Step 4: Who? (Age range, mutual gender preference, 1-on-1 vs group).
  - Step 5: What to discover? (Profession, niche topics, optional notes).
  - Step 6: Review summary with instant edit triggers and explicit "Start Matching" confirmation.

### 2. Smart Matching Engine (5-Factor Weighted Scoring)
- **Configurable Weights**:
  - Shared Interests & Activities: 30%
  - Distance Proximity: 25%
  - Availability Overlap: 20%
  - Discovery & Profession: 15%
  - Profile Completeness: 10%
- **"Why This Person Matches" Badges**: Real-time conversational explanations displayed on cards (e.g. *"Super close by (~1.8 km in Madhapur)"*, *"Shared passion for Design & Technology"*).
- **Mandatory Safety Filters**: All candidates must pass age assurance (18+), have active non-suspended status, and satisfy mutual gender and age criteria before scoring.

### 3. In-Chat "Plan Our Walk" & Google Maps
- Interactive walk proposal cards directly inside 1-on-1 chats.
- Pick from vetted Hyderabad public spots (or custom).
- Mutual agreement required: recipient can **Accept**, **Suggest Change**, or **Decline**.
- Once agreed, displays a one-tap **"Open in Google Maps"** navigation button without exposing private GPS coordinates.

### 4. Interactive Conversation Cards & "Teach Me Something"
- **7 Question Categories**: Icebreakers, Funny, Career & Profession, Life Experiences, Hobbies, Deep Conversations, Hyderabad Discoveries.
- Shuffle / Next card actions with user consent before sending into chat.
- **Teach Me Something**: Share profession concepts, interesting facts, or Hyderabad city lore.

### 5. City Explorer (Hyderabad Vetted Spots)
- Curated list of public walking places: *Durgam Cheruvu Lakefront Boardwalk, KBR National Park, Necklace Road & Tank Bund, Pala Pitta Bio-Park, Sanjeevaiah Park, Gandipet Landscape Park, and Jubilee Hills Cafe Strip*.
- Complete with real coordinates, opening vibes, best walking hours, and safety ratings.

### 6. Small Group Walks (3 - 6 Buddies)
- Pilot architecture for small group walks with capacity caps, organizer verification, join/leave actions, and strict safety rules.

---

## 🛡️ Security Audit & Reliability Repairs (`security-and-reliability-fixes`)

A rigorous codebase audit and security repair was conducted across the database schema, RPC functions, and frontend services:

### 1. Database & Row Level Security (RLS) Hardening
- **Protected Profiles SELECT Policy**: Standard users can only `SELECT` their own profile (`auth.uid() = id OR is_admin()`), preventing mass harvesting of private profile columns.
- **Safe Public Profile View (`public_profiles`)**: Allowlisted projection exposing only non-sensitive columns (`id`, `display_name`, `age`, `avatar_url`, `profession`, `is_profession_verified`, `verification_badge_title`, `preferred_activities`, `preferred_walking_distance`, `walking_pace`, `approx_city`, `approx_area`, `is_location_visible`, `created_at`). Strictly strips `email`, exact `latitude`/`longitude`, `date_of_birth`, internal `role`, and `is_suspended`.
- **Private Coordinates Storage (`user_locations`)**: Raw coordinates are isolated in an independent `user_locations` table protected by strict RLS (`auth.uid() = user_id`).
- **Privilege Escalation Prevention**: `BEFORE UPDATE` trigger on `profiles` rejects unauthorized user modification of `role`, `is_profession_verified`, `verification_badge_title`, `is_suspended`, `is_age_verified`, `age_assurance_status`, and `email`.
- **Immutable Message Read Receipts (`mark_messages_read` RPC)**: Revoked broad `UPDATE` privileges on `messages`. Replaced with a dedicated `SECURITY DEFINER` RPC that only modifies `is_read = true` for messages in active, unblocked matches, preventing message content tampering or sender spoofing.
- **Function Security & Search Path**: All `SECURITY DEFINER` functions enforce `SET search_path = public, pg_temp;` and revoke default execution rights from `PUBLIC` and `anon`.
- **Server-Side Account Deletion (`delete_own_account` RPC)**: Secure RPC executing `DELETE FROM auth.users WHERE id = auth.uid();` ensuring full CASCADE deletion across all tables and real `auth.users` erasure.
- **Location Validation & Rate Limiting**: Added `[-90, 90]` and `[-180, 180]` coordinate validation and a 30-second server rate limit to prevent spoofing or database flooding.

### 2. Age Assurance & Account Integrity
- Server-side validation calculates age from `date_of_birth` and strictly rejects `< 18`.
- Removed fabricated default birth dates (`'2000-01-01'`) and ages (`24`) from user creation triggers.
- Enforced age assurance checks across candidate discovery and matching RPCs.

### 3. Real-Time Chat & Discovery Reliability
- Separated Demo Chat from Live Supabase Chat: seeded mock messages never render in live matches.
- Delivery status tracking (`sending`, `sent`, `failed`) with in-bubble tap-to-retry mechanism.
- Deduplication of incoming messages by server `id` and client-generated `client_id`.
- Cursor-based pagination (`beforeTimestamp`) to load older messages smoothly.
- Inactive / blocked match banner disabling chat input when conversation is closed.
- Realtime subscription cleanup with channel unbinding to prevent memory leaks.
- Matching engine errors surfaced to the user with a retry button instead of silently showing empty candidate lists.

---

## 🔮 Production Limitations & Launch Roadmap

Before launching publicly on the Google Play Store:
1. **Remote Push Notifications**: Requires configuring Firebase Cloud Messaging (FCM) credentials in Expo Application Services (EAS) for background match alerts when the app is closed.
2. **Third-Party Identity Integration**: Professional badge verification currently utilizes document upload with admin dashboard approval. Future releases can integrate DigiLocker / Aadhaar XML or LinkedIn OAuth for automated verification.
3. **Interactive Trail Maps**: The app currently uses reverse geocoding and coarse distance calculations. Adding Google Maps SDK or Mapbox vector tiles will allow visual trail overlays.
