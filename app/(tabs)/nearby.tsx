// ====================================================================
// SCREEN 11: NEARBY PEOPLE (SECURITY & RELIABILITY HARDENED)
// ====================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingIndicator } from '../../src/components/common/LoadingIndicator';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { CandidateBuddy } from '../../src/types';
import { matchingService } from '../../src/services/matching';
import { isSupabaseConfigured } from '../../src/services/supabase';

// ONLY displayed in offline demo evaluation mode
const FALLBACK_NEARBY: CandidateBuddy[] = [
  {
    id: 'seed-ananya-1',
    display_name: 'Ananya Rao',
    age: 25,
    bio: 'Product Designer at a fintech startup. I love exploring cafes around Jubilee Hills and walking by Durgam Cheruvu.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    profession: 'Product Designer',
    is_profession_verified: true,
    verification_badge_title: 'Verified Designer',
    preferred_activities: ['evening_stroll', 'coffee_chat', 'photo_walk'],
    preferred_walking_distance: 'medium_3_5km',
    walking_pace: 'moderate',
    approx_distance_km: 1.8,
    approx_area: 'Madhapur',
    shared_interests: ['Design', 'Technology', 'Startups'],
    compatibility_score: 92,
  },
  {
    id: 'seed-vikram-2',
    display_name: 'Vikram Reddy',
    age: 28,
    bio: 'Backend engineer passionate about distributed systems and AI agents.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    profession: 'Senior Software Engineer',
    is_profession_verified: true,
    verification_badge_title: 'Verified Software Engineer',
    preferred_activities: ['morning_walk', 'tech_talk'],
    preferred_walking_distance: 'long_5km_plus',
    walking_pace: 'brisk',
    approx_distance_km: 2.4,
    approx_area: 'Gachibowli',
    shared_interests: ['Technology', 'Startups', 'Fitness'],
    compatibility_score: 88,
  },
  {
    id: 'seed-priya-3',
    display_name: 'Priya Sharma',
    age: 26,
    bio: 'Healthcare researcher & doctor. Love deep conversations about neuroscience and books.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    profession: 'Doctor & Researcher',
    is_profession_verified: true,
    verification_badge_title: 'Verified Doctor',
    preferred_activities: ['evening_stroll', 'book_discussion'],
    preferred_walking_distance: 'medium_3_5km',
    walking_pace: 'relaxed',
    approx_distance_km: 3.1,
    approx_area: 'Kondapur',
    shared_interests: ['Science', 'Books', 'Philosophy'],
    compatibility_score: 85,
  },
  {
    id: 'seed-rahul-4',
    display_name: 'Rahul Varma',
    age: 27,
    bio: 'Founder building an AgriTech company. Morning walks around KBR Park.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    profession: 'Founder & CEO',
    is_profession_verified: true,
    verification_badge_title: 'Verified Founder',
    preferred_activities: ['morning_walk', 'tech_talk'],
    preferred_walking_distance: 'medium_3_5km',
    walking_pace: 'moderate',
    approx_distance_km: 4.2,
    approx_area: 'Jubilee Hills',
    shared_interests: ['Startups', 'Entrepreneurship', 'Business'],
    compatibility_score: 84,
  },
];

export default function NearbyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [buddies, setBuddies] = useState<CandidateBuddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!isSupabaseConfigured()) {
        setBuddies(FALLBACK_NEARBY);
      } else {
        const result = await matchingService.fetchCandidates(15);
        setBuddies(result.data);
      }
    } catch {
      if (!isSupabaseConfigured()) setBuddies(FALLBACK_NEARBY);
      else setBuddies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = buddies.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.display_name.toLowerCase().includes(q) ||
      (b.profession && b.profession.toLowerCase().includes(q)) ||
      (b.approx_area && b.approx_area.toLowerCase().includes(q)) ||
      b.shared_interests.some((i) => i.toLowerCase().includes(q))
    );
  });

  const renderBuddyItem = ({ item }: { item: CandidateBuddy }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() =>
        router.push({
          pathname: `/profile/[id]`,
          params: { id: item.id, data: JSON.stringify(item) },
        })
      }
      style={[
        styles.gridCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.imageBox}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
            <Ionicons name="person" size={32} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <Text style={styles.scoreText}>{item.compatibility_score}%</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.display_name}, {item.age}
          </Text>
          {item.is_profession_verified && (
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          )}
        </View>

        <Text style={[styles.profession, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.profession || 'Community Member'}
        </Text>

        <View style={styles.distanceRow}>
          <Ionicons name="location-outline" size={12} color={colors.primary} />
          <Text style={[styles.distanceText, { color: colors.textMuted }]}>
            ~{item.approx_distance_km} km • {item.approx_area}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <Header title="Nearby People" subtitle="Buddies in Hyderabad within walking distance" />
      <View style={styles.searchSection}>
        <Input
          placeholder="Filter by interest, profession, or area..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Ionicons name="search" size={18} color={colors.textMuted} />}
          style={{ marginBottom: 0 }}
        />
      </View>

      {loading ? (
        <LoadingIndicator message="Scanning nearby areas..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No Buddies Match Your Filter"
          description="Try clearing your search term to see all people discovering nearby."
          actionTitle="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderBuddyItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  imageBox: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  cardImage: {
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
  badgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  scoreText: {
    ...Typography.caption,
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 10,
  },
  cardDetails: {
    padding: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  name: {
    ...Typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
  profession: {
    ...Typography.caption,
    marginBottom: 6,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    ...Typography.caption,
    fontSize: 11,
  },
});
