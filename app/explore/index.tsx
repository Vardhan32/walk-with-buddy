// ====================================================================
// CITY EXPLORER - HYDERABAD VETTED WALKING TRAILS & PUBLIC SPACES
// ====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { HYDERABAD_WALKING_PLACES } from '../../src/constants/cityExplorer';
import { PlaceCategory, CityPlace } from '../../src/types';

export default function CityExplorerScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>('all');

  const categories: { id: PlaceCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All Spots', icon: 'sparkles' },
    { id: 'boardwalks', label: 'Lake Boardwalks', icon: 'water-outline' },
    { id: 'parks', label: 'Parks & Trails', icon: 'leaf-outline' },
    { id: 'popular', label: 'Waterfront Plazas', icon: 'compass-outline' },
    { id: 'cafes', label: 'Walking Cafes', icon: 'cafe-outline' },
  ];

  const filteredPlaces =
    selectedCategory === 'all'
      ? HYDERABAD_WALKING_PLACES
      : HYDERABAD_WALKING_PLACES.filter((p) => p.category === selectedCategory);

  const handleOpenGoogleMaps = (place: CityPlace) => {
    const query = encodeURIComponent(`${place.name}, ${place.area}, Hyderabad`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch((err) => {
      console.warn('Could not open Google Maps:', err);
      Alert.alert('Navigation Error', 'Unable to launch Google Maps on this device.');
    });
  };

  return (
    <ScreenContainer>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>City Explorer</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Hyderabad Public Walking Spots
          </Text>
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.categoryText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Places List */}
      <ScrollView contentContainerStyle={styles.placesList} showsVerticalScrollIndicator={false}>
        <View style={[styles.noticeCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            All locations are verified public areas with dedicated pedestrian tracks. Always choose a well-lit spot for meeting buddies!
          </Text>
        </View>

        {filteredPlaces.map((place) => (
          <View
            key={place.id}
            style={[
              styles.placeCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? colors.border : '#E2E8F0',
              },
            ]}
          >
            <Image source={{ uri: place.image_url }} style={styles.placeImage} />

            <View style={styles.placeContent}>
              <View style={styles.placeHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.placeName, { color: colors.text }]}>{place.name}</Text>
                  <View style={styles.areaRow}>
                    <Ionicons name="location-sharp" size={12} color={colors.primary} />
                    <Text style={[styles.areaText, { color: colors.textSecondary }]}>{place.area}, Hyderabad</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {place.description}
              </Text>

              {/* Highlights Chips */}
              <View style={styles.highlightsRow}>
                {place.highlights.map((h, idx) => (
                  <View key={idx} style={[styles.highlightChip, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.highlightText, { color: colors.textMuted }]}>• {h}</Text>
                  </View>
                ))}
              </View>

              {/* Schedule and distance metadata */}
              <View style={[styles.metaBox, { backgroundColor: colors.surface }]}>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Best time: <Text style={{ fontWeight: '700', color: colors.text }}>{place.bestTime}</Text>
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="footsteps-outline" size={14} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Vibe: <Text style={{ fontWeight: '700', color: colors.text }}>{place.walkingDistanceVibe}</Text>
                  </Text>
                </View>
              </View>

              {/* Safety Badge */}
              {place.safetyRating && (
                <View style={styles.safetyRow}>
                  <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
                  <Text style={[styles.safetyText, { color: '#16A34A' }]}>{place.safetyRating}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleOpenGoogleMaps(place)}
                  style={[styles.mapsBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="navigate" size={14} color="#FFFFFF" />
                  <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
  categoriesBar: {
    paddingVertical: Spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  placesList: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  noticeText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  placeCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  placeImage: {
    width: '100%',
    height: 180,
  },
  placeContent: {
    padding: Spacing.lg,
  },
  placeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  placeName: {
    ...Typography.bodyLarge,
    fontWeight: '800',
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  areaText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  description: {
    ...Typography.bodySmall,
    lineHeight: 20,
    marginVertical: Spacing.sm,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  highlightChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  highlightText: {
    ...Typography.caption,
    fontSize: 11,
  },
  metaBox: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...Typography.caption,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  safetyText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  mapsBtnText: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
