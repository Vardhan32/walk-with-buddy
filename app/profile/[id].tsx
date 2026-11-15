// ====================================================================
// SCREEN 12: DETAILED USER PROFILE
// ====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { ReportModal } from '../../src/components/safety/ReportModal';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { CandidateBuddy } from '../../src/types';
import { matchingService } from '../../src/services/matching';
import { isSupabaseConfigured } from '../../src/services/supabase';
import { safetyService } from '../../src/services/safety';

export default function DetailedProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();

  const [buddy, setBuddy] = useState<CandidateBuddy>(() => {
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    return {
      id: id || 'seed-ananya-1',
      display_name: 'Ananya Rao',
      age: 25,
      bio: 'Product Designer at a fintech startup. I love exploring cafes around Jubilee Hills and walking by Durgam Cheruvu in the evenings.',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
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
    };
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBlock = () => {
    if (!isSupabaseConfigured()) {
      Alert.alert('Demo mode', 'Blocking is available after you connect a Supabase project.');
      return;
    }

    Alert.alert(
      `Block ${buddy.display_name}?`,
      'They will no longer be able to discover your profile or send you messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await safetyService.blockUser(buddy.id, 'User initiated block');
              Alert.alert('User Blocked', `${buddy.display_name} has been blocked.`);
              router.back();
            } catch (e: any) {
              Alert.alert('Notice', 'User blocked.');
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!isSupabaseConfigured()) {
      Alert.alert('Demo mode', 'Reporting is available after you connect a Supabase project.');
      return;
    }
    setShowReportModal(true);
  };

  const handleLike = async () => {
    if (!isSupabaseConfigured()) {
      if (buddy.id === 'seed-ananya-1') {
        router.push({
          pathname: '/match/celebration',
          params: {
            matchId: 'demo-match-001',
            partnerId: buddy.id,
            partnerName: buddy.display_name,
            partnerAvatar: buddy.avatar_url || '',
            partnerProfession: buddy.profession || '',
            partnerVerified: buddy.is_profession_verified ? 'true' : 'false',
            score: buddy.compatibility_score.toString(),
          },
        });
      } else {
        Alert.alert('Demo mode', 'This sample interaction is only a preview and will not be saved.');
        router.back();
      }
      return;
    }

    try {
      setActionLoading(true);
      const res = await matchingService.sendAction(buddy.id, 'like');
      if (res.matched) {
        router.push({
          pathname: '/match/celebration',
          params: {
            matchId: res.match_id || 'demo-match-001',
            partnerId: buddy.id,
            partnerName: buddy.display_name,
            partnerAvatar: buddy.avatar_url || '',
            partnerProfession: buddy.profession || '',
            partnerVerified: buddy.is_profession_verified ? 'true' : 'false',
            score: buddy.compatibility_score.toString(),
          },
        });
      } else {
        Alert.alert('Liked!', `You liked ${buddy.display_name}. We will let you know when they like you back!`);
        router.back();
      }
    } catch (error) {
      console.warn('Unable to send like:', error);
      Alert.alert('Could not send like', 'Please check your connection and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header
        title={buddy.display_name}
        showBack
        rightAction={
          <View style={styles.headerRightActions}>
            <TouchableOpacity onPress={handleReport} style={styles.iconBtn}>
              <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBlock} style={styles.iconBtn}>
              <Ionicons name="ban-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Photo Container */}
        <View style={styles.heroImageWrapper}>
          {buddy.avatar_url ? (
            <Image source={{ uri: buddy.avatar_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={80} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.scoreFloatBadge}>
            <Ionicons name="sparkles" size={14} color="#FBBF24" style={{ marginRight: 4 }} />
            <Text style={styles.scoreText}>{buddy.compatibility_score}% Compatibility</Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Main Info */}
          <View style={styles.nameSection}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {buddy.display_name}, <Text style={styles.age}>{buddy.age}</Text>
              </Text>
              {buddy.is_profession_verified && (
                <Badge label="Verified" variant="verified" size="md" />
              )}
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
              <Text style={[styles.profession, { color: colors.textSecondary }]}>
                {buddy.profession || 'Professional'}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                Approx. {buddy.approx_distance_km} km away • {buddy.approx_area || 'Hyderabad'}
              </Text>
            </View>
          </View>

          {/* Compatibility Breakdown Card */}
          <View style={[styles.compatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.compatTitle, { color: colors.text }]}>
              Compatibility Estimate
            </Text>
            <Text style={[styles.compatDesc, { color: colors.textMuted }]}>
              Based on Walk With Buddy's weighted matching algorithm:
            </Text>

            <View style={styles.factorsList}>
              <View style={styles.factorRow}>
                <Text style={[styles.factorName, { color: colors.textSecondary }]}>
                  Shared Interests (40% weight):
                </Text>
                <Text style={[styles.factorScore, { color: colors.primary }]}>High</Text>
              </View>
              <View style={styles.factorRow}>
                <Text style={[styles.factorName, { color: colors.textSecondary }]}>
                  Proximity (30% weight):
                </Text>
                <Text style={[styles.factorScore, { color: colors.primary }]}>
                  ~{buddy.approx_distance_km} km
                </Text>
              </View>
              <View style={styles.factorRow}>
                <Text style={[styles.factorName, { color: colors.textSecondary }]}>
                  Walking Style (10% weight):
                </Text>
                <Text style={[styles.factorScore, { color: colors.primary }]}>
                  {buddy.walking_pace}
                </Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>About Me</Text>
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>{buddy.bio}</Text>
          </View>

          {/* Preferred Activities */}
          {buddy.preferred_activities && buddy.preferred_activities.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Preferred Activities
              </Text>
              <View style={styles.chipsWrap}>
                {buddy.preferred_activities.map((act, i) => (
                  <View
                    key={i}
                    style={[styles.activityPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                    <Text style={[styles.pillText, { color: colors.text }]}>{act.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Interests */}
          {buddy.shared_interests && buddy.shared_interests.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Interests & Topics
              </Text>
              <View style={styles.chipsWrap}>
                {buddy.shared_interests.map((int, i) => (
                  <View
                    key={i}
                    style={[styles.interestPill, { backgroundColor: colors.primaryLight }]}
                  >
                    <Text style={[styles.interestText, { color: colors.primaryDark }]}>
                      #{int}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Connect Action Button */}
          <Button
            title={`Walk With ${buddy.display_name.split(' ')[0]}`}
            onPress={handleLike}
            loading={actionLoading}
            size="lg"
            icon={<Ionicons name="footsteps" size={20} color="#FFFFFF" />}
            style={{ marginTop: Spacing.xl, marginBottom: Spacing.xxl }}
          />
        </View>
      </ScrollView>

      {/* Report User Modal */}
      <ReportModal
        visible={showReportModal}
        targetUserId={buddy.id}
        targetUserName={buddy.display_name}
        onClose={() => setShowReportModal(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRightActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  heroImageWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreFloatBadge: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  bodyContent: {
    padding: Spacing.xl,
  },
  nameSection: {
    marginBottom: Spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  age: {
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  profession: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  location: {
    ...Typography.bodySmall,
  },
  compatCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  compatTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  compatDesc: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  factorsList: {
    gap: 6,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorName: {
    ...Typography.bodySmall,
  },
  factorScore: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: Spacing.xl,
  },
  sectionHeading: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  bioText: {
    ...Typography.bodyMedium,
    lineHeight: 22,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  interestPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  interestText: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
