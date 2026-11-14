// ====================================================================
// SCREEN 15: MATCHES LIST (ACTIVE MUTUAL MATCHES & CONVERSATION HUBS)
// ====================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Avatar } from '../../src/components/common/Avatar';
import { Badge } from '../../src/components/common/Badge';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingIndicator } from '../../src/components/common/LoadingIndicator';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { MatchItem } from '../../src/types';
import { matchingService } from '../../src/services/matching';

const DEMO_MATCHES: MatchItem[] = [
  {
    match_id: 'demo-match-001',
    matched_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    compatibility_score: 92,
    last_message_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    last_message_snippet: 'Hey Harsha! Up for an evening walk around Durgam Cheruvu at 6 PM?',
    unread_count: 1,
    partner_id: 'seed-ananya-1',
    partner_name: 'Ananya Rao',
    partner_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    partner_profession: 'Product Designer',
    partner_verified: true,
    partner_approx_area: 'Madhapur',
  },
  {
    match_id: 'demo-match-002',
    matched_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    compatibility_score: 88,
    last_message_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    last_message_snippet: 'Let me know if you want to chat about AI agents sometime!',
    unread_count: 0,
    partner_id: 'seed-vikram-2',
    partner_name: 'Vikram Reddy',
    partner_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    partner_profession: 'Senior Software Engineer',
    partner_verified: true,
    partner_approx_area: 'Gachibowli',
  },
];

export default function MatchesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    try {
      const data = await matchingService.fetchMatches();
      if (data && data.length > 0) {
        setMatches(data);
      } else {
        setMatches(DEMO_MATCHES);
      }
    } catch {
      setMatches(DEMO_MATCHES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const renderMatchRow = ({ item }: { item: MatchItem }) => {
    const formattedTime = new Date(item.last_message_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: `/chat/[matchId]`,
            params: {
              matchId: item.match_id,
              partnerId: item.partner_id,
              partnerName: item.partner_name,
              partnerAvatar: item.partner_avatar || '',
              partnerProfession: item.partner_profession || '',
              partnerVerified: item.partner_verified ? 'true' : 'false',
            },
          })
        }
        style={[styles.matchRow, { borderBottomColor: colors.border }]}
      >
        <Avatar
          url={item.partner_avatar}
          name={item.partner_name}
          size="md"
          isVerified={item.partner_verified}
        />

        <View style={styles.centerCol}>
          <View style={styles.topRow}>
            <Text style={[styles.partnerName, { color: colors.text }]} numberOfLines={1}>
              {item.partner_name}
            </Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formattedTime}</Text>
          </View>

          <View style={styles.subtitleRow}>
            <Text style={[styles.professionText, { color: colors.primary }]}>
              {item.partner_profession} • {item.partner_approx_area}
            </Text>
            <View style={[styles.scoreBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={styles.scoreText}>{item.compatibility_score}%</Text>
            </View>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[
                styles.snippetText,
                { color: item.unread_count > 0 ? colors.text : colors.textMuted },
                item.unread_count > 0 && { fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {item.last_message_snippet || 'Connected! Tap to plan a walk.'}
            </Text>
            {item.unread_count > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCountText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <Header
        title="Walk Buddies"
        subtitle="Your mutual connections & conversations"
      />

      {loading ? (
        <LoadingIndicator message="Loading your connections..." />
      ) : matches.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No Connections Yet"
          description="Like candidate buddies on Discovery. When the interest is mutual, your match will appear here!"
          actionTitle="Find Buddies Now"
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          renderItem={renderMatchRow}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMatches();
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  centerCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  partnerName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    flex: 1,
  },
  timeText: {
    ...Typography.caption,
    fontSize: 11,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  professionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snippetText: {
    ...Typography.bodySmall,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
