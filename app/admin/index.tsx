// ====================================================================
// SCREEN 25: ADMIN MODERATION & REVIEW DASHBOARD
// ====================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();

  return (
    <ScreenContainer>
      <Header title="Admin Moderation Portal" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBanner}>
          <Ionicons name="shield-half" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Hyderabad Moderation Console</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Restricted access portal for reviewing safety reports, approving professional badges, and enforcing community safety.
          </Text>
        </View>

        {/* Action Navigation Cards */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/admin/reports')}
          style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="flag" size={24} color={colors.danger} />
          </View>
          <View style={styles.actionDetails}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>User Safety Reports</Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              Review harassment, fake accounts, or safety incidents and take suspension actions.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/admin/verifications')}
          style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="ribbon" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionDetails}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Professional Identity Verifications
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              Review submitted doctor licenses, work badges, and grant verified status.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Security & Access Notice */}
        <View style={[styles.auditBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.secondary} />
          <Text style={[styles.auditText, { color: colors.textSecondary }]}>
            Every moderation action and badge assignment is logged with admin user ID and timestamp in Supabase audit records.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  topBanner: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.titleSmall,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySmall,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionDesc: {
    ...Typography.caption,
    lineHeight: 16,
  },
  auditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  auditText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 16,
  },
});
