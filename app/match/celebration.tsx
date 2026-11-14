// ====================================================================
// SCREEN 14: MATCH CONFIRMATION & CELEBRATION
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Button } from '../../src/components/common/Button';
import { Avatar } from '../../src/components/common/Avatar';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

export default function MatchCelebrationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const {
    matchId,
    partnerId,
    partnerName = 'Buddy',
    partnerAvatar,
    partnerProfession,
    partnerVerified,
    score = '90',
  } = useLocalSearchParams<{
    matchId: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar?: string;
    partnerProfession?: string;
    partnerVerified?: string;
    score?: string;
  }>();

  const handleStartChat = () => {
    router.replace({
      pathname: `/chat/[matchId]`,
      params: {
        matchId: matchId || 'demo-match-001',
        partnerId: partnerId || 'seed-ananya-1',
        partnerName: partnerName || 'Ananya Rao',
        partnerAvatar: partnerAvatar || '',
        partnerProfession: partnerProfession || '',
        partnerVerified: partnerVerified || 'false',
      },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Celebration Header */}
        <View style={styles.topSection}>
          <View style={[styles.sparkleIcon, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="sparkles" size={32} color="#D97706" />
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>It's a Match!</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            You and {partnerName} both want to connect and walk together.
          </Text>
        </View>

        {/* Dual Avatars */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar
              url={profile?.avatar_url}
              name={profile?.display_name || 'You'}
              size="xl"
              isVerified={profile?.is_profession_verified}
            />
            <Text style={[styles.avatarLabel, { color: colors.text }]}>You</Text>
          </View>

          <View style={[styles.connectorCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="footsteps" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.avatarWrapper}>
            <Avatar
              url={partnerAvatar}
              name={partnerName}
              size="xl"
              isVerified={partnerVerified === 'true'}
            />
            <Text style={[styles.avatarLabel, { color: colors.text }]} numberOfLines={1}>
              {partnerName.split(' ')[0]}
            </Text>
          </View>
        </View>

        {/* Match Compatibility Badge */}
        <View style={[styles.compatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="heart-circle" size={20} color={colors.primary} />
          <Text style={[styles.compatText, { color: colors.text }]}>
            {score}% Compatibility Score
          </Text>
        </View>

        {/* Safety Note */}
        <View style={[styles.safetyCard, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primaryDark} style={{ marginRight: 8 }} />
          <Text style={[styles.safetyText, { color: colors.primaryDark }]}>
            Safety tip: Choose public Hyderabad walking trails like Durgam Cheruvu Lakefront or KBR Park.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={`Message ${partnerName.split(' ')[0]}`}
            onPress={handleStartChat}
            size="lg"
            icon={<Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />}
            style={styles.primaryBtn}
          />

          <Button
            title="Keep Exploring"
            variant="ghost"
            onPress={() => router.back()}
            size="md"
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
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    maxWidth: 280,
    lineHeight: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: Spacing.xl,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  connectorCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  compatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  compatText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginVertical: Spacing.md,
    width: '100%',
  },
  safetyText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    marginBottom: Spacing.sm,
  },
});
