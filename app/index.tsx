// ====================================================================
// SCREEN 1: SPLASH SCREEN & ENTRY ROUTING
// ====================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../src/constants/theme';
import { APP_CONFIG } from '../src/constants/config';

export default function SplashScreen() {
  const router = useRouter();
  const { user, profile, isLoading, isOnboarded } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (user && profile) {
        if (isOnboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/profile-setup');
        }
      } else {
        router.replace('/welcome');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoading, user, profile, isOnboarded]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
        <Ionicons name="footsteps" size={48} color="#FFFFFF" />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Walk With Buddy</Text>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>
        {APP_CONFIG.tagline}
      </Text>
      <View style={[styles.launchBadge, { backgroundColor: colors.surface }]}>
        <Ionicons name="location" size={14} color={colors.primary} />
        <Text style={[styles.launchText, { color: colors.textSecondary }]}>
          Hyderabad, India
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    ...Typography.titleLarge,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  launchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: 6,
  },
  launchText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
