// ====================================================================
// SCREEN 23: COMMUNITY SAFETY GUIDELINES & HYDERABAD WALK ADVICE
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { APP_CONFIG } from '../../src/constants/config';

export default function SafetyGuidelinesScreen() {
  const { colors } = useTheme();

  return (
    <ScreenContainer>
      <Header title="Safety Guidelines" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-checkmark" size={36} color={colors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Safe & Respectful Discovery</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Walk With Buddy is built on mutual respect and shared curiosity. Follow these core safety rules for every connection.
          </Text>
        </View>

        {/* Five Golden Rules */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>The 5 Safety Principles</Text>

          {APP_CONFIG.safetyTips.map((tip, idx) => (
            <View key={idx} style={styles.tipRow}>
              <View style={[styles.tipNumber, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.tipNumberText, { color: colors.primaryDark }]}>{idx + 1}</Text>
              </View>
              <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Recommended Public Hyderabad Walking Spots */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Recommended Public Meet Locations in Hyderabad
          </Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            For your first walks, we recommend popular, well-lit, open public parks with active security:
          </Text>

          <View style={styles.spotItem}>
            <Ionicons name="water-outline" size={18} color={colors.primary} />
            <View style={styles.spotDetails}>
              <Text style={[styles.spotName, { color: colors.text }]}>Durgam Cheruvu Lakefront</Text>
              <Text style={[styles.spotDesc, { color: colors.textMuted }]}>
                Hitec City / Madhapur • Beautiful lighted boardwalk and lake view.
              </Text>
            </View>
          </View>

          <View style={styles.spotItem}>
            <Ionicons name="leaf-outline" size={18} color={colors.primary} />
            <View style={styles.spotDetails}>
              <Text style={[styles.spotName, { color: colors.text }]}>KBR National Park</Text>
              <Text style={[styles.spotDesc, { color: colors.textMuted }]}>
                Jubilee Hills • Scenic 5km jogging and walking perimeter trail.
              </Text>
            </View>
          </View>

          <View style={styles.spotItem}>
            <Ionicons name="walk-outline" size={18} color={colors.primary} />
            <View style={styles.spotDetails}>
              <Text style={[styles.spotName, { color: colors.text }]}>Tank Bund & Necklace Road</Text>
              <Text style={[styles.spotDesc, { color: colors.textMuted }]}>
                Central Hyderabad • Wide promenade around Hussain Sagar lake.
              </Text>
            </View>
          </View>

          <View style={styles.spotItem}>
            <Ionicons name="trail-sign-outline" size={18} color={colors.primary} />
            <View style={styles.spotDetails}>
              <Text style={[styles.spotName, { color: colors.text }]}>Pala Pitta Cycling & Walking Park</Text>
              <Text style={[styles.spotDesc, { color: colors.textMuted }]}>
                Botanical Garden Road, Kondapur • Lush green walking tracks.
              </Text>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={[styles.emergencyBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="call" size={20} color={colors.danger} style={{ marginRight: Spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.emTitle, { color: colors.text }]}>Emergency Helplines (Telangana)</Text>
            <Text style={[styles.emText, { color: colors.textSecondary }]}>
              • Police: 100 / 112{'\n'}
              • Women Safety Helpline: 1091 / 181{'\n'}
              • She Teams Hyderabad: 9490616555
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  topCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleSmall,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 290,
  },
  sectionCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  cardDesc: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipText: {
    ...Typography.bodySmall,
    flex: 1,
    lineHeight: 18,
  },
  spotItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  spotDetails: {
    flex: 1,
  },
  spotName: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  spotDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  emTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: 4,
  },
  emText: {
    ...Typography.caption,
    lineHeight: 18,
  },
});
