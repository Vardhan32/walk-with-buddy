# Walk With Buddy 🚶‍♂️🤝

> *"Find someone nearby. Connect. Decide what to do together."*

**Walk With Buddy** is a modern, Android-first social discovery platform launching in **Hyderabad, Telangana, India**. It helps adults (18+) discover interesting people nearby, connect through shared interests, and choose whether they want to walk, explore trails, talk tech & startups, exercise, or spend meaningful time together outdoors.

---

## 📋 Progress Checklist

- [x] **Project Scaffolding**: React Native + Expo SDK 58 + TypeScript + Expo Router.
- [x] **Design System**: Light & Dark themes, typography scale, responsive layout, reusable buttons, cards, avatars, badges, and modals.
- [x] **Prototype screens and navigation**:
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
- [x] **Supabase schema**: Initial SQL migration in `supabase/migrations/20261114000000_walk_with_buddy_schema.sql` with tables, triggers, indexes, RLS policies, and secure RPC functions.
- [x] **Matching logic**: Four-factor compatibility scoring (interests, proximity, availability, walking preference) is implemented in the client helper and database RPC. Live discovery requires the Supabase migration and project configuration.
- [x] **Match persistence**: The migration defines canonical user-pair ordering to prevent duplicate match pairs.
- [x] **Chat integration**: Message writes and Supabase Realtime subscriptions are implemented; live delivery depends on the project's Realtime publication and RLS configuration.
- [x] **GPS & Location Privacy**: Coarse location, approximate distance only (km), exact GPS coordinates never revealed.
- [x] **Tests**: `npm test` runs the pure matching-logic test suite; `npm run typecheck` checks TypeScript types.
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

---

## 🔮 Production Readiness & Future Enhancements

Before launching publicly on the Google Play Store:
1. **Automated Push Notifications**: Configure Firebase Cloud Messaging (FCM) via Expo Notifications for instant alert when a mutual match or chat message arrives.
2. **Third-Party Identity API**: Integrate Digilocker / Aadhaar XML or LinkedIn OAuth for automated professional verification.
3. **Google Maps SDK / Mapbox**: Add an interactive Hyderabad trail map overlay if users request route tracing.
