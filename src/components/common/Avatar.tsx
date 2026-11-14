// ====================================================================
// WALK WITH BUDDY - AVATAR COMPONENT
// ====================================================================

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Radius } from '../../constants/theme';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isVerified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = 'Buddy',
  size = 'md',
  isVerified = false,
}) => {
  const { colors } = useTheme();

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { size: 36, font: 14, iconSize: 12 };
      case 'lg':
        return { size: 72, font: 26, iconSize: 20 };
      case 'xl':
        return { size: 108, font: 38, iconSize: 28 };
      default:
        return { size: 48, font: 18, iconSize: 16 };
    }
  };

  const { size: dim, font, iconSize } = getDimensions();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={{ width: dim, height: dim, position: 'relative' }}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={[
            styles.image,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              backgroundColor: colors.surface,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              backgroundColor: colors.primaryLight,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: font, color: colors.primaryDark }]}>
            {initials}
          </Text>
        </View>
      )}

      {isVerified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              bottom: 0,
              right: 0,
              backgroundColor: colors.card,
              borderColor: colors.card,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={iconSize} color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
});
