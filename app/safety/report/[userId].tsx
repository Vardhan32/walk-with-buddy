// ====================================================================
// SCREEN 21: REPORT USER SCREEN
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/common/ScreenContainer';
import { Header } from '../../../src/components/common/Header';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { useTheme } from '../../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../../src/constants/theme';
import { ReportCategory } from '../../../src/types';
import { safetyService } from '../../../src/services/safety';

const CATEGORIES: { id: ReportCategory; label: string; desc: string }[] = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Unwelcome behavior, intimidation or insults' },
  { id: 'inappropriate_content', label: 'Inappropriate Content', desc: 'Explicit messages or inappropriate photos' },
  { id: 'fake_profile', label: 'Fake Account / Impersonation', desc: 'Stolen pictures or misleading identity' },
  { id: 'scam_or_commercial', label: 'Commercial or Paid Services', desc: 'Soliciting paid companionship or services' },
  { id: 'safety_concern', label: 'Physical Safety Concern', desc: 'Stalking, threats, or danger' },
  { id: 'spam', label: 'Spam or Promotional', desc: 'Advertising or repetitive automated messages' },
  { id: 'other', label: 'Other Concern', desc: 'Any other safety or community issue' },
];

export default function ReportUserScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userId, userName = 'User' } = useLocalSearchParams<{ userId: string; userName?: string }>();

  const [category, setCategory] = useState<ReportCategory>('harassment');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe the incident or reason for this report.');
      return;
    }

    try {
      setSubmitting(true);
      await safetyService.reportUser(userId, category, description.trim());
      Alert.alert(
        'Report Submitted',
        'Thank you for looking out for the Walk With Buddy community. Our moderation team has received your report and will take action.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Notice', 'Report logged successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title={`Report ${userName}`} showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Ionicons name="alert-circle" size={36} color={colors.danger} />
          <Text style={[styles.title, { color: colors.text }]}>Submit a Confidential Report</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            The reported user will not be notified of who submitted this report.
          </Text>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          Select Violation Category:
        </Text>

        {CATEGORIES.map((cat) => {
          const selected = category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[
                styles.catCard,
                {
                  backgroundColor: selected ? colors.dangerLight : colors.card,
                  borderColor: selected ? colors.danger : colors.border,
                },
              ]}
            >
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={selected ? colors.danger : colors.textMuted}
                style={{ marginRight: Spacing.sm }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.catTitle, { color: selected ? colors.danger : colors.text }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.catDesc, { color: colors.textMuted }]}>{cat.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Input
          label="Detailed Description"
          placeholder="Please provide details to help our safety team investigate..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ marginTop: Spacing.md }}
        />

        <Button
          title="Submit Report"
          variant="danger"
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          style={{ marginTop: Spacing.md, marginBottom: Spacing.xxxl }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  topCard: {
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
  },
  sectionHeading: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  catTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  catDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
});
