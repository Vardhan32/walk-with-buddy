// ====================================================================
// SCREEN 18: SETTINGS & ACCOUNT HUB
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Avatar } from '../../src/components/common/Avatar';
import { Badge } from '../../src/components/common/Badge';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { profile, isAdmin, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Walk With Buddy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/welcome');
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/profile/edit')}
          style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Avatar
            url={profile?.avatar_url}
            name={profile?.display_name || 'Buddy'}
            size="lg"
            isVerified={profile?.is_profession_verified}
          />

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {profile?.display_name || 'Harsha Vardhan'}
              </Text>
              {profile?.is_profession_verified && (
                <Badge label="Verified" variant="verified" size="sm" />
              )}
            </View>

            <Text style={[styles.profileSubtitle, { color: colors.textSecondary }]}>
              {profile?.profession || 'Professional'} • {profile?.approx_area || 'Hyderabad'}
            </Text>

            <View style={styles.editPromptRow}>
              <Text style={[styles.editPromptText, { color: colors.primary }]}>
                Edit Profile & Preferences
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Verification Banner if not verified */}
        {!profile?.is_profession_verified && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/verification/request')}
            style={[styles.banner, { backgroundColor: colors.accentLight, borderColor: '#F59E0B' }]}
          >
            <Ionicons name="ribbon-outline" size={20} color="#B45309" style={{ marginRight: Spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: '#92400E' }]}>
                Get Your Professional Badge
              </Text>
              <Text style={[styles.bannerDesc, { color: '#B45309' }]}>
                Submit your work ID or license for verification to build trust.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B45309" />
          </TouchableOpacity>
        )}

        {/* Admin Section (Restricted / Available to Admins) */}
        {isAdmin && (
          <View style={styles.menuSection}>
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              ADMINISTRATION & MODERATION
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/admin')}
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="shield-half-outline" size={20} color={colors.primary} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  Admin Moderation Dashboard
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Safety & Trust Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            SAFETY & TRUST
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/safety/guidelines')}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Community Safety Guidelines
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/safety/block-list')}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="ban-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Blocked Users</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings/privacy')}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.secondary} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Privacy & Discovery</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            PREFERENCES
          </Text>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.menuLeft}>
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={colors.text}
              />
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                Appearance ({isDark ? 'Dark Theme' : 'Light Theme'})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            ACCOUNT
          </Text>

          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Log Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings/delete-account')}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuLabel, { color: colors.danger }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          Walk With Buddy v1.0.0 • Hyderabad, India
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  profileName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  profileSubtitle: {
    ...Typography.bodySmall,
    marginBottom: 6,
  },
  editPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editPromptText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  bannerTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  bannerDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
  menuSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeading: {
    ...Typography.caption,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuLabel: {
    ...Typography.bodyMedium,
    fontWeight: '500',
  },
  versionText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
