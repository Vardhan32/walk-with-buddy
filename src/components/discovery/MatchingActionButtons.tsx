// ====================================================================
// WALK WITH BUDDY - MATCHING ACTION BUTTONS
// ====================================================================

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing } from '../../constants/theme';

interface MatchingActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onInfo: () => void;
  disabled?: boolean;
}

export const MatchingActionButtons: React.FC<MatchingActionButtonsProps> = ({
  onPass,
  onLike,
  onInfo,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Pass / Skip Button */}
      <TouchableOpacity
        onPress={onPass}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.actionButton,
          styles.passButton,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="close" size={28} color={colors.danger} />
      </TouchableOpacity>

      {/* Info / Profile Details Button */}
      <TouchableOpacity
        onPress={onInfo}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.infoButton,
          {
            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="information" size={20} color={colors.secondary} />
      </TouchableOpacity>

      {/* Connect & Walk (Like) Button */}
      <TouchableOpacity
        onPress={onLike}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.actionButton,
          styles.likeButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      >
        <Ionicons name="footsteps" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xl,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  passButton: {
    shadowColor: '#000',
  },
  likeButton: {
    borderWidth: 0,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
