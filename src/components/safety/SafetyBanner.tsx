// ====================================================================
// WALK WITH BUDDY - SAFETY BANNER COMPONENT
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';

export const SafetyBanner: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/safety/guidelines')}
      style={[
        styles.container,
        {
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary,
        },
      ]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={18} color={colors.primaryDark} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.primaryDark }]}>
          Walk Safe in Hyderabad
        </Text>
        <Text style={[styles.subtitle, { color: colors.primaryDark }]}>
          Always meet in public locations like parks or lakefronts. Tap to read safety tips.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 2,
    lineHeight: 16,
  },
});
