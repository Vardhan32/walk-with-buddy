// ====================================================================
// WALK WITH BUDDY - PROFILE CARD COMPONENT
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CandidateBuddy } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { Badge } from '../common/Badge';

const { width } = Dimensions.get('window');

interface ProfileCardProps {
  buddy: CandidateBuddy;
  onPress?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ buddy, onPress }) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.imageContainer}>
        {buddy.avatar_url ? (
          <Image source={{ uri: buddy.avatar_url }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
            <Ionicons name="person" size={72} color={colors.textMuted} />
          </View>
        )}

        {/* Compatibility Score Overlay */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBadge, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]}>
            <Ionicons name="sparkles" size={13} color="#FBBF24" style={{ marginRight: 4 }} />
            <Text style={styles.scoreText}>{buddy.compatibility_score}% Match</Text>
          </View>
        </View>

        {/* Distance and Location Overlay */}
        <View style={styles.locationOverlay}>
          <View style={[styles.locBadge, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]}>
            <Ionicons name="location-sharp" size={12} color="#14B8A6" style={{ marginRight: 4 }} />
            <Text style={styles.locText}>
              ~{buddy.approx_distance_km} km • {buddy.approx_area || 'Hyderabad'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContent}>
        {/* Name, Age and Verification */}
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.text }]}>
            {buddy.display_name}, <Text style={styles.age}>{buddy.age}</Text>
          </Text>
          {buddy.is_profession_verified && (
            <Badge label="Verified" variant="verified" size="sm" />
          )}
        </View>

        {/* Profession */}
        {buddy.profession ? (
          <View style={styles.professionRow}>
            <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.professionText, { color: colors.textSecondary }]}>
              {buddy.profession}
            </Text>
            {buddy.verification_badge_title && buddy.is_profession_verified ? (
              <Text style={[styles.verifiedTitleText, { color: colors.primary }]}>
                • {buddy.verification_badge_title}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Why this person matches */}
        {buddy.match_reasons && buddy.match_reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            <View style={styles.reasonsHeaderRow}>
              <Ionicons name="sparkles" size={13} color="#F59E0B" />
              <Text style={[styles.reasonsHeaderTitle, { color: colors.text }]}>
                Why this person matches:
              </Text>
            </View>
            <View style={styles.reasonsList}>
              {buddy.match_reasons.map((reason, idx) => (
                <View
                  key={idx}
                  style={[styles.reasonBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} style={{ marginRight: 5 }} />
                  <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                    {reason}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bio Snippet */}
        {buddy.bio ? (
          <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
            {buddy.bio}
          </Text>
        ) : null}

        {/* Shared Interests */}
        {buddy.shared_interests && buddy.shared_interests.length > 0 && (
          <View style={styles.chipsSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Shared Interests:
            </Text>
            <View style={styles.chipsRow}>
              {buddy.shared_interests.slice(0, 3).map((interest, idx) => (
                <View
                  key={idx}
                  style={[styles.interestChip, { backgroundColor: colors.primaryLight }]}
                >
                  <Text style={[styles.interestText, { color: colors.primaryDark }]}>
                    #{interest}
                  </Text>
                </View>
              ))}
              {buddy.shared_interests.length > 3 && (
                <View style={[styles.interestChip, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.interestText, { color: colors.textMuted }]}>
                    +{buddy.shared_interests.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Walking Preference Info */}
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <View style={styles.prefItem}>
            <Ionicons name="footsteps-outline" size={13} color={colors.primary} />
            <Text style={[styles.prefText, { color: colors.textSecondary }]}>
              {buddy.preferred_walking_distance === 'short_1_2km'
                ? '1-2 km'
                : buddy.preferred_walking_distance === 'long_5km_plus'
                ? '5+ km'
                : '3-5 km'}
            </Text>
          </View>
          <View style={styles.prefDivider} />
          <View style={styles.prefItem}>
            <Ionicons name="speedometer-outline" size={13} color={colors.primary} />
            <Text style={[styles.prefText, { color: colors.textSecondary }]}>
              {buddy.walking_pace || 'Moderate'} pace
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  scoreText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  locationOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  locText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoContent: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  age: {
    fontWeight: '400',
  },
  professionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 6,
  },
  professionText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  verifiedTitleText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  reasonsContainer: {
    marginVertical: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  reasonsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  reasonsHeaderTitle: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  reasonsList: {
    gap: 4,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  reasonText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  bio: {
    ...Typography.bodySmall,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  chipsSection: {
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    ...Typography.caption,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  interestText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prefDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginHorizontal: Spacing.md,
  },
  prefText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
