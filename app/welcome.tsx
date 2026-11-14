// ====================================================================
// SCREEN 2: WELCOME SCREEN
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../src/components/common/ScreenContainer';
import { Button } from '../src/components/common/Button';
import { useTheme } from '../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../src/constants/theme';
import { APP_CONFIG } from '../src/constants/config';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="people" size={44} color={colors.primaryDark} />
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>Walk With Buddy</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            {APP_CONFIG.tagline}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Why Walk With Buddy?</Text>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="rocket-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Tech, Startups & Ideas
              </Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Connect with engineers, founders, designers, and students in Hyderabad.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Healthy & Engaging
              </Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Trade screen time for a refreshing walk around local parks and trails.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Verified & Respectful
              </Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Not a dating app, not paid companionship. Genuine social discovery.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Button
            title="Create Free Account"
            onPress={() => router.push('/onboarding')}
            size="lg"
            style={styles.primaryBtn}
          />

          <Button
            title="I Already Have an Account"
            variant="outline"
            onPress={() => router.push('/auth/login')}
            size="lg"
            style={styles.secondaryBtn}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heading: {
    ...Typography.titleLarge,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 290,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginVertical: Spacing.lg,
  },
  cardTitle: {
    ...Typography.titleSmall,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  ctaSection: {
    marginTop: Spacing.md,
  },
  primaryBtn: {
    marginBottom: Spacing.md,
  },
  secondaryBtn: {},
});
