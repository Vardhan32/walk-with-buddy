// ====================================================================
// GROUP WALKS - SMALL GROUP DISCOVERY & COMMUNITY WALKS (HYDERABAD)
// ====================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Avatar } from '../../src/components/common/Avatar';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { GroupWalk } from '../../src/types';
import { matchingService } from '../../src/services/matching';
import { isSupabaseConfigured } from '../../src/services/supabase';

// Initial curated Hyderabad group walks
const DEMO_GROUP_WALKS: GroupWalk[] = [
  {
    id: 'group-walk-001',
    creator_id: 'seed-ananya-1',
    title: 'Sunset Lakefront Walk & Tech Chat',
    description:
      'Join us for a relaxing 3 km walk on Durgam Cheruvu Boardwalk. We will stroll, watch the sunset, and chat about startups, design, and apps.',
    meeting_place: 'Inorbit Mall Boardwalk Entrance (Near Starbucks)',
    approx_area: 'Madhapur',
    meeting_time: new Date(Date.now() + 86400000 * 2).toISOString(), // In 2 days
    max_participants: 6,
    current_participants: 4,
    status: 'upcoming',
    category: 'tech_and_startups',
    created_at: new Date().toISOString(),
    creator: {
      display_name: 'Ananya Rao',
      profession: 'Product Designer',
      is_profession_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    },
    participants: [
      {
        id: 'p-1',
        walk_id: 'group-walk-001',
        user_id: 'seed-ananya-1',
        status: 'joined',
        created_at: new Date().toISOString(),
        user: { display_name: 'Ananya R.', profession: 'Designer' },
      },
      {
        id: 'p-2',
        walk_id: 'group-walk-001',
        user_id: 'seed-vikram-2',
        status: 'joined',
        created_at: new Date().toISOString(),
        user: { display_name: 'Vikram R.', profession: 'Engineer' },
      },
      {
        id: 'p-3',
        walk_id: 'group-walk-001',
        user_id: 'seed-priya-3',
        status: 'joined',
        created_at: new Date().toISOString(),
        user: { display_name: 'Priya S.', profession: 'Doctor' },
      },
    ],
  },
  {
    id: 'group-walk-002',
    creator_id: 'seed-rahul-4',
    title: 'Saturday Morning 5K & Coffee',
    description:
      'A brisk 4.8 km lap around KBR National Park perimeter trail followed by filter coffee and startup discussions at Jubilee Hills.',
    meeting_place: 'KBR Park Main Gate (Opposite TDP Office)',
    approx_area: 'Jubilee Hills',
    meeting_time: new Date(Date.now() + 86400000 * 4).toISOString(), // In 4 days
    max_participants: 6,
    current_participants: 3,
    status: 'upcoming',
    category: 'fitness_and_speed',
    created_at: new Date().toISOString(),
    creator: {
      display_name: 'Rahul Varma',
      profession: 'Founder & CEO',
      is_profession_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    },
    participants: [
      {
        id: 'p-4',
        walk_id: 'group-walk-002',
        user_id: 'seed-rahul-4',
        status: 'joined',
        created_at: new Date().toISOString(),
        user: { display_name: 'Rahul V.', profession: 'Founder' },
      },
    ],
  },
];

export default function GroupWalksScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const [groupWalks, setGroupWalks] = useState<GroupWalk[]>(DEMO_GROUP_WALKS);
  const [joinedWalkIds, setJoinedWalkIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadGroups() {
      if (isSupabaseConfigured()) {
        try {
          const walks = await matchingService.fetchGroupWalks();
          if (walks && walks.length > 0) {
            setGroupWalks(walks);
          }
        } catch (e) {
          console.warn('Failed to load group walks:', e);
        }
      }
    }
    loadGroups();
  }, []);

  const handleToggleJoin = async (walk: GroupWalk) => {
    const isJoined = joinedWalkIds.includes(walk.id);

    if (isJoined) {
      // Leave
      setJoinedWalkIds((prev) => prev.filter((id) => id !== walk.id));
      if (isSupabaseConfigured()) {
        matchingService.leaveGroupWalk(walk.id).catch(() => {});
      }
      Alert.alert('Left Group Walk', `You have left "${walk.title}".`);
    } else {
      // Join
      if ((walk.current_participants || 0) >= walk.max_participants) {
        Alert.alert('Walk Full', 'This group walk has reached its maximum safety capacity of 6 participants.');
        return;
      }

      setJoinedWalkIds((prev) => [...prev, walk.id]);
      if (isSupabaseConfigured()) {
        matchingService.joinGroupWalk(walk.id).catch(() => {});
      }
      Alert.alert(
        'Spot Confirmed! 🎉',
        `You have joined "${walk.title}"!\n\nMeeting Spot: ${walk.meeting_place}\nTime: ${new Date(walk.meeting_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
      );
    }
  };

  const handleOpenMaps = (walk: GroupWalk) => {
    const query = encodeURIComponent(`${walk.meeting_place}, ${walk.approx_area}, Hyderabad`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>Small Group Walks</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Hyderabad Community Walks (Max 6 Buddies)
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Safety & Consent Guidelines Card */}
        <View style={[styles.guidelinesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.guidelinesHeader}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={[styles.guidelinesTitle, { color: colors.text }]}>Group Walk Guidelines</Text>
          </View>
          <Text style={[styles.guidelinesText, { color: colors.textSecondary }]}>
            • Capped at 3 - 6 adult buddies per walk for a safe, conversational atmosphere.
            {'\n'}• Strictly scheduled in well-known, public Hyderabad trails and parks.
            {'\n'}• Mutual consent: Participants can leave anytime and report any misconduct.
          </Text>
        </View>

        {/* Group Walks List */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Upcoming Walks in Hyderabad</Text>

        {groupWalks.map((walk) => {
          const isJoined = joinedWalkIds.includes(walk.id);
          const spotsLeft = walk.max_participants - (walk.current_participants || 0);

          return (
            <View
              key={walk.id}
              style={[
                styles.walkCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? colors.border : '#E2E8F0',
                },
              ]}
            >
              {/* Category & Spots Left */}
              <View style={styles.walkCardTopRow}>
                <Badge
                  label={walk.category === 'tech_and_startups' ? 'Tech & Startups' : 'Fitness Walk'}
                  variant="primary"
                  size="sm"
                />
                <Text style={[styles.spotsText, { color: spotsLeft > 0 ? '#16A34A' : colors.danger }]}>
                  {spotsLeft > 0 ? `${spotsLeft} spots open` : 'Full'}
                </Text>
              </View>

              <Text style={[styles.walkTitle, { color: colors.text }]}>{walk.title}</Text>
              <Text style={[styles.walkDesc, { color: colors.textSecondary }]}>{walk.description}</Text>

              {/* Time and Meeting Place */}
              <View style={[styles.detailsBox, { backgroundColor: colors.surface }]}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {new Date(walk.meeting_time).toLocaleString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={15} color={colors.primary} />
                  <Text style={[styles.detailText, { color: colors.text }]} numberOfLines={1}>
                    {walk.meeting_place} ({walk.approx_area})
                  </Text>
                </View>
              </View>

              {/* Creator info & Participants */}
              <View style={styles.participantsRow}>
                <View style={styles.creatorInfo}>
                  <Avatar url={walk.creator?.avatar_url} name={walk.creator?.display_name} size="sm" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.creatorName, { color: colors.text }]}>
                      Organized by {walk.creator?.display_name || 'Verified Buddy'}
                    </Text>
                    {walk.creator?.profession ? (
                      <Text style={[styles.creatorProfession, { color: colors.textMuted }]}>
                        {walk.creator.profession}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Capacity badge */}
                <View style={[styles.capacityPill, { backgroundColor: colors.surface }]}>
                  <Ionicons name="people" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.capacityText, { color: colors.text }]}>
                    {walk.current_participants || 0} / {walk.max_participants}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleOpenMaps(walk)}
                  style={[styles.mapsBtn, { borderColor: colors.border }]}
                >
                  <Ionicons name="navigate-outline" size={14} color={colors.text} />
                  <Text style={[styles.mapsBtnText, { color: colors.text }]}>View Location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleToggleJoin(walk)}
                  style={[
                    styles.joinBtn,
                    {
                      backgroundColor: isJoined ? colors.surface : colors.primary,
                      borderColor: isJoined ? colors.danger : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.joinBtnText,
                      { color: isJoined ? colors.danger : '#FFFFFF' },
                    ]}
                  >
                    {isJoined ? 'Leave Walk' : 'Join Walk'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    ...Typography.titleSmall,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.caption,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  guidelinesCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  guidelinesTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  guidelinesText: {
    ...Typography.caption,
    lineHeight: 18,
  },
  sectionHeading: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  walkCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  walkCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  spotsText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  walkTitle: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    marginBottom: 4,
  },
  walkDesc: {
    ...Typography.bodySmall,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  detailsBox: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorName: {
    ...Typography.caption,
    fontWeight: '700',
  },
  creatorProfession: {
    ...Typography.caption,
    fontSize: 11,
  },
  capacityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  capacityText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  mapsBtnText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  joinBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  joinBtnText: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
