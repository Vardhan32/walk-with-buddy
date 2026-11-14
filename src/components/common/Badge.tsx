// ====================================================================
// WALK WITH BUDDY - BADGE & CHIP COMPONENT
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'verified' | 'distance' | 'score' | 'neutral' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
  onPress,
  selected = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const getColors = () => {
    if (selected) {
      return { bg: colors.primary, text: '#FFFFFF', border: colors.primary };
    }

    switch (variant) {
      case 'primary':
        return { bg: colors.primaryLight, text: colors.primaryDark, border: colors.primary };
      case 'verified':
        return { bg: colors.primaryLight, text: colors.primaryDark, border: colors.primary };
      case 'distance':
        return { bg: isDark ? '#1E293B' : '#F1F5F9', text: colors.textSecondary, border: 'transparent' };
      case 'score':
        return { bg: colors.accentLight, text: '#92400E', border: 'transparent' };
      case 'danger':
        return { bg: colors.dangerLight, text: colors.danger, border: 'transparent' };
      default:
        return { bg: colors.surface, text: colors.textSecondary, border: colors.border };
    }
  };

  const scheme = getColors();
  const isSm = size === 'sm';

  const content = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
          paddingVertical: isSm ? 2 : Spacing.xs,
          paddingHorizontal: isSm ? Spacing.sm : Spacing.md,
        },
        style,
      ]}
    >
      {variant === 'verified' && (
        <Ionicons
          name="checkmark-circle"
          size={isSm ? 12 : 14}
          color={colors.primary}
          style={styles.icon}
        />
      )}
      {icon && variant !== 'verified' && (
        <Ionicons
          name={icon}
          size={isSm ? 12 : 14}
          color={scheme.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: scheme.text,
            fontSize: isSm ? 11 : 12,
            fontWeight: variant === 'verified' || variant === 'score' ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...Typography.caption,
  },
});
