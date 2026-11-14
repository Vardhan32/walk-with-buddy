// ====================================================================
// SCREEN 3: ONBOARDING INTRO SLIDESHOW
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

const SLIDES = [
  {
    icon: 'compass',
    title: 'Discover Buddies Nearby',
    description:
      'Find curious minds, techies, creative professionals, and fitness enthusiasts right in Hyderabad.',
  },
  {
    icon: 'sparkles',
    title: 'Smart Matching Engine',
    description:
      'We calculate mutual compatibility from your shared interests, walking distance preferences, and availability.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Safe & Respectful',
    description:
      'No exact GPS coordinates exposed, voluntary professional identity badges, and verified community guidelines.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/auth/register');
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Button
            title="Skip"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/auth/register')}
          />
        </View>

        <View style={styles.slideContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name={slide.icon as any} size={64} color={colors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {slide.description}
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentSlide ? colors.primary : colors.surfaceSubtle,
                    width: idx === currentSlide ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <Button
            title={currentSlide === SLIDES.length - 1 ? 'Start Your Journey' : 'Next'}
            onPress={handleNext}
            size="lg"
            style={styles.actionBtn}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'flex-end',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.titleMedium,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    marginBottom: Spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    width: '100%',
  },
});
