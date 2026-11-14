// ====================================================================
// SCREEN 10: HOME / DISCOVERY SCREEN (SECURITY & RELIABILITY HARDENED)
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
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { CandidateBuddy, DiscoveryRadius } from '../../src/types';
import { matchingService } from '../../src/services/matching';
import { APP_CONFIG } from '../../src/constants/config';
import { isSupabaseConfigured } from '../../src/services/supabase';

// ONLY displayed in offline demo evaluation mode
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
    compatibility_score: 92,
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
    compatibility_score: 88,
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
    compatibility_score: 85,
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
    compatibility_score: 84,
  },
];

export default function DiscoveryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();

  const [candidates, setCandidates] = useState<CandidateBuddy[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [radius, setRadius] = useState<DiscoveryRadius>(profile?.discovery_radius_km || 5);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setRpcError(null);

      if (!isSupabaseConfigured()) {
        // Offline demo preview
        setCandidates(SEEDED_HYDERABAD_CANDIDATES);
      } else {
        const result = await matchingService.fetchCandidates(radius);
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
  }, [radius]);

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

  const currentBuddy = candidates[currentIndex];

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
          onPress={() => setShowRadiusSelector(!showRadiusSelector)}
          style={[styles.radiusFilterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="funnel-outline" size={14} color={colors.primary} />
          <Text style={[styles.radiusBtnText, { color: colors.text }]}>{radius} km</Text>
        </TouchableOpacity>
      </View>

      {/* Radius selector dropdown */}
      {showRadiusSelector && (
        <View style={[styles.radiusDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.radiusLabel, { color: colors.textSecondary }]}>
            Discovery Radius (Hyderabad):
          </Text>
          <View style={styles.radiusPillsRow}>
            {APP_CONFIG.radiusOptions.map((r) => {
              const selected = radius === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    setRadius(r);
                    setShowRadiusSelector(false);
                  }}
                  style={[
                    styles.radiusPill,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.radiusPillText, { color: selected ? '#FFFFFF' : colors.text }]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <SafetyBanner />

        {loading ? (
          <LoadingIndicator message="Discovering compatible buddies nearby..." />
        ) : rpcError ? (
          <View style={[styles.errorCard, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle" size={32} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.danger }]}>Discovery Error</Text>
            <Text style={[styles.errorDesc, { color: colors.danger }]}>{rpcError}</Text>
            <Button
              title="Retry Discovery"
              variant="outline"
              size="sm"
              onPress={loadCandidates}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : currentBuddy ? (
          <View style={styles.cardContainer}>
            <ProfileCard
              buddy={currentBuddy}
              onPress={() =>
                router.push({
                  pathname: `/profile/[id]`,
                  params: {
                    id: currentBuddy.id,
                    data: JSON.stringify(currentBuddy),
                  },
                })
              }
            />

            <MatchingActionButtons
              onPass={() => handleAction('pass')}
              onLike={() => handleAction('like')}
              onInfo={() =>
                router.push({
                  pathname: `/profile/[id]`,
                  params: {
                    id: currentBuddy.id,
                    data: JSON.stringify(currentBuddy),
                  },
                })
              }
              disabled={actionInProgress}
            />
          </View>
        ) : (
          <EmptyState
            icon="compass"
            title="You've Explored Everyone Nearby!"
            description={`No more candidate buddies found within ${radius} km in Hyderabad right now. Try expanding your discovery radius or check back soon.`}
            actionTitle="Expand to 15 km"
            onAction={() => setRadius(15)}
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
    paddingHorizontal: Spacing.xl,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  areaSubtitle: {
    ...Typography.caption,
  },
  radiusFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  radiusBtnText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  radiusDropdown: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  radiusLabel: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  radiusPillText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  cardContainer: {
    paddingHorizontal: Spacing.lg,
  },
  errorCard: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  errorTitle: {
    ...Typography.titleSmall,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  errorDesc: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
  },
});
