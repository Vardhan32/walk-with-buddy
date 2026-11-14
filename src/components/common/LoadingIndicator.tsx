// ====================================================================
// WALK WITH BUDDY - LOADING INDICATOR COMPONENT
// ====================================================================

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing } from '../../constants/theme';

interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Finding buddies nearby...',
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={[styles.text, { color: colors.textMuted }]}>{message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  text: {
    ...Typography.bodyMedium,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
