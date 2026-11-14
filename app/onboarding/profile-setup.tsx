// ====================================================================
// SCREEN 8: PROFILE CREATION & WALKING PREFERENCES
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { PROFESSIONAL_TITLES, PREFERRED_ACTIVITIES } from '../../src/constants/interests';
import { APP_CONFIG } from '../../src/constants/config';
import { WalkingDistancePref, WalkingPace } from '../../src/types';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, updateCurrentProfile } = useAuth();

  const [profession, setProfession] = useState(profile?.profession || 'Software Engineer');
  const [bio, setBio] = useState(
    profile?.bio || 'Looking forward to evening walks and conversations around tech and startups.'
  );
  const [distancePref, setDistancePref] = useState<WalkingDistancePref>(
    profile?.preferred_walking_distance || 'medium_3_5km'
  );
  const [pace, setPace] = useState<WalkingPace>(profile?.walking_pace || 'moderate');
  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    profile?.preferred_activities || ['evening_stroll', 'tech_talk', 'coffee_chat']
  );
  const [loading, setLoading] = useState(false);

  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (!bio.trim()) {
      Alert.alert('Required', 'Please write a brief bio about yourself.');
      return;
    }

    try {
      setLoading(true);
      await updateCurrentProfile({
        profession: profession.trim(),
        bio: bio.trim(),
        preferred_walking_distance: distancePref,
        walking_pace: pace,
        preferred_activities: selectedActivities,
      });

      router.push('/onboarding/interests');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Profile Setup (Step 1 of 3)" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Tell Us About Yourself</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your walking preferences help our matching engine suggest the most compatible buddies.
        </Text>

        {/* Profession */}
        <Input
          label="Profession / Field"
          placeholder="e.g. Software Engineer, Designer, Student"
          value={profession}
          onChangeText={setProfession}
          helperText="You can request an official verification badge later."
        />

        {/* Bio */}
        <Input
          label="Short Bio"
          placeholder="What do you enjoy talking about or doing on a walk?"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />

        {/* Preferred Walking Distance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Preferred Walking Distance:
          </Text>
          {APP_CONFIG.walkingDistances.map((item) => {
            const selected = distancePref === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setDistancePref(item.id as WalkingDistancePref)}
                style={[
                  styles.optionCard,
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
                    styles.optionText,
                    { color: selected ? colors.primaryDark : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Walking Pace */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Your Walking Pace:
          </Text>
          <View style={styles.chipsRow}>
            {APP_CONFIG.walkingPaces.map((item) => {
              const selected = pace === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setPace(item.id as WalkingPace)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preferred Activities */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Activities You're Open To:
          </Text>
          <View style={styles.chipsRow}>
            {PREFERRED_ACTIVITIES.map((act) => {
              const selected = selectedActivities.includes(act.id);
              return (
                <TouchableOpacity
                  key={act.id}
                  onPress={() => toggleActivity(act.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {act.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Continue to Interests"
          onPress={handleNext}
          loading={loading}
          size="lg"
          style={styles.nextBtn}
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
  title: {
    ...Typography.titleMedium,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  optionText: {
    ...Typography.bodyMedium,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  nextBtn: {
    marginTop: Spacing.md,
  },
});
