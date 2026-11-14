// ====================================================================
// SCREEN 10: HOME / CONVERSATIONAL DISCOVERY ASSISTANT
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { ProfileCard } from '../../src/components/discovery/ProfileCard';
import { MatchingActionButtons } from '../../src/components/discovery/MatchingActionButtons';
import { SafetyBanner } from '../../src/components/safety/SafetyBanner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingIndicator } from '../../src/components/common/LoadingIndicator';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDiscovery } from '../../src/context/DiscoveryContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { CandidateBuddy, DiscoveryMode, DiscoveryRadius } from '../../src/types';
import { matchingService } from '../../src/services/matching';
import { APP_CONFIG } from '../../src/constants/config';
import { isSupabaseConfigured } from '../../src/services/supabase';

// Offline demo preview candidates enriched with match reasons
const SEEDED_HYDERABAD_CANDIDATES: CandidateBuddy[] = [
  {
    id: 'seed-ananya-1',
    display_name: 'Ananya Rao',
    age: 25,
    bio: 'Product Designer at a fintech startup. I love exploring cafes around Jubilee Hills and walking by Durgam Cheruvu in the evenings.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    profession: 'Product Designer',
    is_profession_verified: true,
    verification_badge_title: 'Verified Designer',
    preferred_activities: ['evening_stroll', 'coffee_chat', 'photo_walk'],
    preferred_walking_distance: 'medium_3_5km',
    walking_pace: 'moderate',
    approx_distance_km: 1.8,
    approx_area: 'Madhapur',
    shared_interests: ['Design', 'Technology', 'Startups', 'Photography'],
    compatibility_score: 94,
    match_reasons: [
      'Super close by (~1.8 km in Madhapur)',
      'Shared passion for Design & Technology',
      'Both enjoy sunset lake walks',
    ],
  },
  {
    id: 'seed-vikram-2',
    display_name: 'Vikram Reddy',
    age: 28,
    bio: 'Backend engineer passionate about distributed systems and AI agents. Training for a 10k run, always up for morning walks.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    profession: 'Senior Software Engineer',
    is_profession_verified: true,
    verification_badge_title: 'Verified Software Engineer',
    preferred_activities: ['morning_walk', 'tech_talk', 'fitness_jog'],
    preferred_walking_distance: 'long_5km_plus',
    walking_pace: 'brisk',
    approx_distance_km: 2.4,
    approx_area: 'Gachibowli',
    shared_interests: ['Technology', 'Startups', 'Fitness', 'Science'],
    compatibility_score: 89,
    match_reasons: [
      'Within walking radius (~2.4 km in Gachibowli)',
      'Tech & startup discussions',
      'Matching brisk walking pace',
    ],
  },
  {
    id: 'seed-priya-3',
    display_name: 'Priya Sharma',
    age: 26,
    bio: 'Healthcare researcher & doctor. Love deep conversations about neuroscience, philosophy, and books while walking outdoors.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    profession: 'Medical Doctor / Researcher',
    is_profession_verified: true,
    verification_badge_title: 'Verified Doctor',
    preferred_activities: ['evening_stroll', 'book_discussion', 'coffee_chat'],
    preferred_walking_distance: 'medium_3_5km',
    walking_pace: 'relaxed',
    approx_distance_km: 3.1,
    approx_area: 'Kondapur',
    shared_interests: ['Science', 'Books', 'Philosophy', 'Nature'],
    compatibility_score: 86,
    match_reasons: [
      'Different professional journey (Doctor)',
      'Shared curiosity for Books & Science',
      'Relaxed conversational pace',
    ],
  },
  {
    id: 'seed-rahul-4',
    display_name: 'Rahul Varma',
    age: 27,
    bio: 'Founder building an AgriTech company. Looking for morning walking buddies around KBR National Park to discuss startups and business.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    profession: 'Founder & CEO',
    is_profession_verified: true,
    verification_badge_title: 'Verified Founder',
    preferred_activities: ['morning_walk', 'tech_talk', 'explore_city'],
    preferred_walking_distance: 'medium_3_5km',
    walking_pace: 'moderate',
    approx_distance_km: 4.2,
    approx_area: 'Jubilee Hills',
    shared_interests: ['Startups', 'Entrepreneurship', 'Business', 'Technology'],
    compatibility_score: 85,
    match_reasons: [
      'Entrepreneurship & new venture talks',
      'Frequent morning walker at KBR Park',
      'Moderate 3-5 km distance',
    ],
  },
];

export default function DiscoveryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const { filter, isCustomFilterActive, startDiscoveryWithMode, resetFilter } = useDiscovery();

  const [candidates, setCandidates] = useState<CandidateBuddy[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setRpcError(null);

      if (!isSupabaseConfigured()) {
        // Filter demo candidates according to mode and radius
        let pool = [...SEEDED_HYDERABAD_CANDIDATES];

        if (filter.mode === 'surprise_me') {
          // Shuffle or diversify
          pool = pool.sort(() => Math.random() - 0.5);
        } else if (filter.mode === 'profession' && filter.selectedProfessions && filter.selectedProfessions.length > 0) {
          pool = pool.filter((c) =>
            filter.selectedProfessions!.some((p) => c.profession?.toLowerCase().includes(p.toLowerCase()))
          );
          if (pool.length === 0) pool = SEEDED_HYDERABAD_CANDIDATES.slice(0, 2);
        } else if (filter.mode === 'different_from_me') {
          pool = pool.filter((c) => c.profession !== profile?.profession);
        }

        // Apply radius filter
        pool = pool.filter((c) => c.approx_distance_km <= filter.radiusKm * 1.5);
        setCandidates(pool);
      } else {
        const result = await matchingService.fetchConversationalMatches(filter);
        if (result.error) {
          setRpcError(result.error);
          setCandidates([]);
        } else {
          setCandidates(result.data);
        }
      }
      setCurrentIndex(0);
    } catch (e: any) {
      setRpcError(e?.message || 'Failed to discover nearby buddies.');
      setCandidates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, profile]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCandidates();
  };

  const handleAction = async (action: 'like' | 'pass') => {
    if (currentIndex >= candidates.length || actionInProgress) return;

    const currentBuddy = candidates[currentIndex];
    setActionInProgress(true);

    try {
      const result = await matchingService.sendAction(currentBuddy.id, action);

      if (action === 'like' && (result.matched || currentBuddy.id.startsWith('seed-ananya'))) {
        router.push({
          pathname: '/match/celebration',
          params: {
            matchId: result.match_id || 'demo-match-001',
            partnerId: currentBuddy.id,
            partnerName: currentBuddy.display_name,
            partnerAvatar: currentBuddy.avatar_url || '',
            partnerProfession: currentBuddy.profession || '',
            partnerVerified: currentBuddy.is_profession_verified ? 'true' : 'false',
            score: currentBuddy.compatibility_score.toString(),
          },
        });
      }

      setCurrentIndex((prev) => prev + 1);
    } catch (e: any) {
      console.warn('Action response:', e?.message);
      setCurrentIndex((prev) => prev + 1);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSelectMode = (mode: DiscoveryMode) => {
    startDiscoveryWithMode(mode);
    if (mode === 'group_walk') {
      router.push('/groups');
    } else {
      router.push({
        pathname: '/discovery/guide',
        params: { initialMode: mode },
      });
    }
  };

  const currentBuddy = candidates[currentIndex];

  const getModeLabel = (mode: DiscoveryMode) => {
    switch (mode) {
      case 'surprise_me':
        return 'Surprise Me';
      case 'similar_interests':
        return 'Similar Interests';
      case 'profession':
        return 'Profession';
      case 'different_from_me':
        return 'Different From Me';
      case 'group_walk':
        return 'Group Walk';
      default:
        return 'Smart Discovery';
    }
  };

  return (
    <ScreenContainer>
      {/* Top App Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.miniLogo, { backgroundColor: colors.primary }]}>
            <Ionicons name="footsteps" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.appTitle, { color: colors.text }]}>Walk With Buddy</Text>
            <Text style={[styles.areaSubtitle, { color: colors.textMuted }]}>
              {profile?.approx_area || 'Hyderabad'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/explore')}
          style={[styles.cityExplorerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="map-outline" size={14} color={colors.primary} />
          <Text style={[styles.cityExplorerText, { color: colors.text }]}>Trails</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <SafetyBanner />

        {/* ================================================================= */}
        {/* 1. CONVERSATIONAL ASSISTANT DISCOVERY CARDS */}
        {/* ================================================================= */}
        <View style={[styles.assistantCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.assistantGreetingRow}>
            <View style={[styles.assistantAvatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greetingSubtitle, { color: colors.primary }]}>
                Conversational Discovery
              </Text>
              <Text style={[styles.greetingQuestion, { color: colors.text }]}>
                Ready to meet someone new?
              </Text>
              <Text style={[styles.greetingSubtext, { color: colors.textSecondary }]}>
                Who would you like to meet today?
              </Text>
            </View>
          </View>

          {/* Interactive Discovery Choice Cards */}
          <View style={styles.modesGrid}>
            {/* 1. SURPRISE ME */}
            <TouchableOpacity
              onPress={() => handleSelectMode('surprise_me')}
              style={[
                styles.modeCard,
                {
                  backgroundColor: filter.mode === 'surprise_me' && isCustomFilterActive ? colors.primaryLight : colors.surface,
                  borderColor: filter.mode === 'surprise_me' && isCustomFilterActive ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.modeIconCircle, { backgroundColor: '#FDE68A' }]}>
                <Ionicons name="shuffle" size={18} color="#D97706" />
              </View>
              <Text style={[styles.modeTitle, { color: colors.text }]}>Surprise Me</Text>
              <Text style={[styles.modeDesc, { color: colors.textMuted }]}>
                Serendipitous, diverse match with high compatibility
              </Text>
            </TouchableOpacity>

            {/* 2. SOMEONE WITH SIMILAR INTERESTS */}
            <TouchableOpacity
              onPress={() => handleSelectMode('similar_interests')}
              style={[
                styles.modeCard,
                {
                  backgroundColor: filter.mode === 'similar_interests' && isCustomFilterActive ? colors.primaryLight : colors.surface,
                  borderColor: filter.mode === 'similar_interests' && isCustomFilterActive ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.modeIconCircle, { backgroundColor: '#BBF7D0' }]}>
                <Ionicons name="heart" size={18} color="#16A34A" />
              </View>
              <Text style={[styles.modeTitle, { color: colors.text }]}>Similar Interests</Text>
              <Text style={[styles.modeDesc, { color: colors.textMuted }]}>
                Passionate about shared hobbies, books & topics
              </Text>
            </TouchableOpacity>

            {/* 3. SOMEONE FROM A PROFESSION */}
            <TouchableOpacity
              onPress={() => handleSelectMode('profession')}
              style={[
                styles.modeCard,
                {
                  backgroundColor: filter.mode === 'profession' && isCustomFilterActive ? colors.primaryLight : colors.surface,
                  borderColor: filter.mode === 'profession' && isCustomFilterActive ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.modeIconCircle, { backgroundColor: '#BFDBFE' }]}>
                <Ionicons name="briefcase" size={18} color="#2563EB" />
              </View>
              <Text style={[styles.modeTitle, { color: colors.text }]}>By Profession</Text>
              <Text style={[styles.modeDesc, { color: colors.textMuted }]}>
                Doctor, engineer, founder, lawyer, artist & more
              </Text>
            </TouchableOpacity>

            {/* 4. SOMEONE DIFFERENT FROM ME */}
            <TouchableOpacity
              onPress={() => handleSelectMode('different_from_me')}
              style={[
                styles.modeCard,
                {
                  backgroundColor: filter.mode === 'different_from_me' && isCustomFilterActive ? colors.primaryLight : colors.surface,
                  borderColor: filter.mode === 'different_from_me' && isCustomFilterActive ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.modeIconCircle, { backgroundColor: '#E9D5FF' }]}>
                <Ionicons name="planet" size={18} color="#9333EA" />
              </View>
              <Text style={[styles.modeTitle, { color: colors.text }]}>Different From Me</Text>
              <Text style={[styles.modeDesc, { color: colors.textMuted }]}>
                Broaden perspectives with diverse backgrounds
              </Text>
            </TouchableOpacity>

            {/* 5. GROUP WALK */}
            <TouchableOpacity
              onPress={() => handleSelectMode('group_walk')}
              style={[
                styles.modeCard,
                styles.modeCardFull,
                {
                  backgroundColor: filter.mode === 'group_walk' && isCustomFilterActive ? colors.primaryLight : colors.surface,
                  borderColor: filter.mode === 'group_walk' && isCustomFilterActive ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.modeIconCircle, { backgroundColor: '#FED7AA' }]}>
                  <Ionicons name="people" size={18} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeTitle, { color: colors.text }]}>Group Walks (3-6 People)</Text>
                  <Text style={[styles.modeDesc, { color: colors.textMuted }]}>
                    Join scheduled public walks around Hyderabad parks and boardwalks
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Discovery Filter Banner */}
        <View style={[styles.filterStatusRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.filterStatusLeft}>
            <Ionicons name="funnel" size={14} color={colors.primary} />
            <Text style={[styles.filterStatusText, { color: colors.text }]}>
              {getModeLabel(filter.mode)} • {filter.radiusKm} km radius
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/discovery/guide')}
            style={styles.changeFilterBtn}
          >
            <Text style={[styles.changeFilterText, { color: colors.primary }]}>Customize</Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* 2. MATCH DISCOVERY DECK */}
        {/* ================================================================= */}
        {loading ? (
          <LoadingIndicator message="Finding compatible buddies nearby..." />
        ) : rpcError ? (
          <View style={[styles.errorCard, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle" size={32} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.danger }]}>Discovery Error</Text>
            <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{rpcError}</Text>
            <Button
              title="Retry Discovery"
              onPress={loadCandidates}
              variant="outline"
              size="sm"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : currentBuddy ? (
          <View style={styles.deckContainer}>
            <ProfileCard
              buddy={currentBuddy}
              onPress={() => router.push(`/profile/${currentBuddy.id}`)}
            />

            <MatchingActionButtons
              onPass={() => handleAction('pass')}
              onLike={() => handleAction('like')}
              onInfo={() => router.push(`/profile/${currentBuddy.id}`)}
              disabled={actionInProgress}
            />

            <Text style={[styles.remainingText, { color: colors.textMuted }]}>
              Buddy {currentIndex + 1} of {candidates.length} in {profile?.approx_area || 'Hyderabad'}
            </Text>
          </View>
        ) : (
          <EmptyState
            icon="people-outline"
            title="No more buddies in this radius"
            description="You've reviewed everyone matching your criteria. Try expanding your walking radius or trying Surprise Me mode!"
            actionTitle="Discover with Surprise Me"
            onAction={() => handleSelectMode('surprise_me')}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    ...Typography.titleSmall,
    fontWeight: '800',
  },
  areaSubtitle: {
    ...Typography.caption,
  },
  cityExplorerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  cityExplorerText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  assistantCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  assistantGreetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  assistantAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSubtitle: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingQuestion: {
    ...Typography.titleLarge,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 2,
  },
  greetingSubtext: {
    ...Typography.bodySmall,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  modeCard: {
    width: '48.5%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  modeCardFull: {
    width: '100%',
    marginTop: 4,
  },
  modeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  modeTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: 2,
  },
  modeDesc: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
  filterStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  filterStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterStatusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  changeFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeFilterText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  deckContainer: {
    alignItems: 'center',
  },
  remainingText: {
    ...Typography.caption,
    marginTop: Spacing.md,
  },
  errorCard: {
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  errorTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  errorDesc: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
});
