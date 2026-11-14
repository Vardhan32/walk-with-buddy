// ====================================================================
// WALK WITH BUDDY - BUTTON COMPONENT
// ====================================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const { colors } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let bg = colors.primary;
    let border = 'transparent';

    if (variant === 'secondary') {
      bg = colors.surfaceSubtle;
    } else if (variant === 'outline') {
      bg = 'transparent';
      border = colors.borderStrong;
    } else if (variant === 'danger') {
      bg = colors.danger;
    } else if (variant === 'ghost') {
      bg = 'transparent';
    }

    let paddingVertical = Spacing.md;
    let paddingHorizontal = Spacing.xl;

    if (size === 'sm') {
      paddingVertical = Spacing.sm;
      paddingHorizontal = Spacing.md;
    } else if (size === 'lg') {
      paddingVertical = Spacing.lg;
      paddingHorizontal = Spacing.xxl;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth: variant === 'outline' ? 1.5 : 0,
      borderRadius: Radius.lg,
      paddingVertical,
      paddingHorizontal,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextColor = (): string => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    if (variant === 'outline') return colors.text;
    if (variant === 'ghost') return colors.primary;
    return colors.text;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.leftIcon}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.rightIcon}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.button,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});
