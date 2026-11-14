// ====================================================================
// SCREEN 19: PRIVACY SETTINGS
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { GenderPreferenceType } from '../../src/types';

const PREFERENCE_OPTIONS: { id: GenderPreferenceType; label: string; desc: string }[] = [
  { id: 'all', label: 'Everyone', desc: 'Discover buddies of all gender identities' },
  { id: 'men', label: 'Men Only', desc: 'Discover men only' },
  { id: 'women', label: 'Women Only', desc: 'Discover women only' },
  { id: 'non_binary', label: 'Non-Binary Only', desc: 'Discover non-binary individuals' },
];

export default function PrivacySettingsScreen() {
  const { colors } = useTheme();
  const { profile, updateCurrentProfile } = useAuth();

  const [locationVisible, setLocationVisible] = useState(profile?.is_location_visible ?? true);
  const [genderPref, setGenderPref] = useState<GenderPreferenceType>(
    profile?.gender_preference || 'all'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCurrentProfile({
        is_location_visible: locationVisible,
        gender_preference: genderPref,
      });
      Alert.alert('Privacy Updated', 'Your privacy preferences have been saved successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update privacy preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Privacy Settings" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Location Privacy Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Show Approximate Distance
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                When enabled, candidate buddies can see your estimated distance (e.g. "~2.5 km away"). Your exact GPS coordinates are NEVER revealed.
              </Text>
            </View>
            <Switch
              value={locationVisible}
              onValueChange={setLocationVisible}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
            />
          </View>
        </View>

        {/* Discovery Gender Preference */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: Spacing.sm }]}>
            Who Can Discover You & Who You Discover
          </Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            Our matching engine strictly enforces mutual compatibility. You only discover people who also want to connect with you.
          </Text>

          {PREFERENCE_OPTIONS.map((opt) => {
            const selected = genderPref === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setGenderPref(opt.id)}
                style={[
                  styles.prefOption,
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
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.optLabel,
                      { color: selected ? colors.primaryDark : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.optDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Data Protection Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="lock-closed" size={20} color={colors.primary} style={{ marginRight: Spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Protected Private Data
            </Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              Your email address, phone number, and exact coordinates are strictly protected behind PostgreSQL Row Level Security and are never exposed via candidate queries.
            </Text>
          </View>
        </View>

        <Button
          title="Save Privacy Preferences"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={{ marginTop: Spacing.lg }}
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
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  prefOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  optLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  optDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoDesc: {
    ...Typography.caption,
    lineHeight: 18,
  },
});
