// ====================================================================
// WALK WITH BUDDY - CARD COMPONENT
// ====================================================================

import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Radius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const { colors, isDark } = useTheme();

  const getCardStyle = (): ViewStyle => {
    if (variant === 'outlined') {
      return {
        backgroundColor: colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
      };
    }
    
    if (variant === 'elevated') {
      return {
        backgroundColor: colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: isDark ? colors.border : '#E2E8F0',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 12,
        elevation: 3,
      };
    }

    return {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};
