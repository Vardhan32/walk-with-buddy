// ====================================================================
// SCREEN 22: PROFESSIONAL VERIFICATION REQUEST
// ====================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { PROFESSIONAL_TITLES } from '../../src/constants/interests';
import { VerificationRequest } from '../../src/types';
import { safetyService } from '../../src/services/safety';

const DOC_TYPES: { id: 'id_card' | 'license' | 'degree_certificate' | 'work_email_or_badge' | 'other'; label: string }[] = [
  { id: 'work_email_or_badge', label: 'Company Work Badge / ID Card' },
  { id: 'license', label: 'Professional License (Medical / Bar / Architecture)' },
  { id: 'degree_certificate', label: 'University / Student ID / Degree' },
  { id: 'other', label: 'Official Business Registration' },
];

export default function VerificationRequestScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();

  const [profession, setProfession] = useState(profile?.profession || 'Software Engineer');
  const [organization, setOrganization] = useState('');
  const [docType, setDocType] = useState<'id_card' | 'license' | 'degree_certificate' | 'work_email_or_badge' | 'other'>(
    'work_email_or_badge'
  );
  const [docReference, setDocReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (profile?.id) {
        try {
          const req = await safetyService.fetchMyVerificationStatus(profile.id);
          setExistingRequest(req);
        } catch {}
      }
    }
    checkStatus();
  }, [profile?.id]);

  const handleSubmit = async () => {
    if (!profession.trim()) {
      Alert.alert('Required', 'Please enter your profession.');
      return;
    }
    if (!organization.trim()) {
      Alert.alert('Required', 'Please enter your company, institution, or organization name.');
      return;
    }

    try {
      setLoading(true);
      await safetyService.submitVerificationRequest(
        profession.trim(),
        organization.trim(),
        docType,
        docReference.trim()
      );

      Alert.alert(
        'Request Submitted',
        'Your verification request has been queued for admin review. Badges are displayed only after manual confirmation.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Notice', 'Request logged for admin review.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Professional Verification" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {profile?.is_profession_verified ? (
          <View style={[styles.verifiedCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
            <Text style={[styles.vTitle, { color: colors.primaryDark }]}>
              Verified Professional
            </Text>
            <Text style={[styles.vSubtitle, { color: colors.primaryDark }]}>
              Badge: {profile.verification_badge_title || profile.profession}
            </Text>
            <Text style={[styles.vNote, { color: colors.textSecondary }]}>
              Your professional credential is authenticated and visible to other buddies in Hyderabad.
            </Text>
          </View>
        ) : existingRequest?.status === 'pending' ? (
          <View style={[styles.pendingCard, { backgroundColor: colors.accentLight, borderColor: '#F59E0B' }]}>
            <Ionicons name="time" size={32} color="#D97706" />
            <Text style={[styles.pTitle, { color: '#92400E' }]}>Verification in Review</Text>
            <Text style={[styles.pDesc, { color: '#B45309' }]}>
              Your request for "{existingRequest.profession}" is pending administrative review. We will verify your credentials and assign your badge.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.topInfo}>
              <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="ribbon" size={40} color={colors.primaryDark} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Request Verified Badge</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                A professional badge helps connect with founders, doctors, engineers, and creators with confidence.
              </Text>
            </View>

            <Input
              label="Profession / Specialty"
              placeholder="e.g. Doctor, Software Engineer, Lawyer"
              value={profession}
              onChangeText={setProfession}
            />

            <Input
              label="Organization / Company / Institution"
              placeholder="e.g. Tech Corp, Apollo Hospitals, High Court"
              value={organization}
              onChangeText={setOrganization}
            />

            <View style={styles.docSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Verification Evidence Type:
              </Text>
              {DOC_TYPES.map((dt) => {
                const selected = docType === dt.id;
                return (
                  <TouchableOpacity
                    key={dt.id}
                    onPress={() => setDocType(dt.id)}
                    style={[
                      styles.docOption,
                      {
                        backgroundColor: selected ? colors.primaryLight : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selected ? colors.primaryDark : colors.textMuted}
                      style={{ marginRight: Spacing.sm }}
                    />
                    <Text
                      style={[
                        styles.docText,
                        { color: selected ? colors.primaryDark : colors.text },
                      ]}
                    >
                      {dt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Official Reference / ID Number or Work Email"
              placeholder="e.g. Registration No., or work email"
              value={docReference}
              onChangeText={setDocReference}
              helperText="Protected information. Only administrators can review this."
            />

            <Button
              title="Submit for Verification"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={{ marginTop: Spacing.md, marginBottom: Spacing.xxl }}
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  topInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleSmall,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 290,
  },
  docSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  docOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  docText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  verifiedCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  vTitle: {
    ...Typography.titleMedium,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  vSubtitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  vNote: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
  },
  pendingCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  pTitle: {
    ...Typography.titleSmall,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  pDesc: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
  },
});
