// ====================================================================
// SCREEN 4: USER REGISTRATION (AGE ASSURANCE & MUTUAL PREFERENCES)
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { GenderPreferenceType, GenderType } from '../../src/types';
import { authService } from '../../src/services/auth';

const GENDER_OPTIONS: { id: GenderType; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non_binary', label: 'Non-Binary' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const PREFERENCE_OPTIONS: { id: GenderPreferenceType; label: string }[] = [
  { id: 'all', label: 'Open to Everyone' },
  { id: 'men', label: 'Men only' },
  { id: 'women', label: 'Women only' },
  { id: 'non_binary', label: 'Non-Binary only' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('2000-01-15'); // YYYY-MM-DD
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<GenderType>('male');
  const [genderPref, setGenderPref] = useState<GenderPreferenceType>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateAge = (dobString: string): number => {
    const parts = dobString.split('-');
    if (parts.length === 3) {
      const birthYear = parseInt(parts[0], 10);
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear) && birthYear > 1920 && birthYear <= currentYear) {
        return currentYear - birthYear;
      }
    }
    return 24;
  };

  const handleDobChange = (text: string) => {
    setDob(text);
    const calculated = calculateAge(text);
    setAge(calculated);
  };

  const handleRegister = async () => {
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your full name or display name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (age < 18) {
      setError('You must be 18 or older to use Walk With Buddy.');
      return;
    }

    try {
      setLoading(true);
      await authService.signUp({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        dateOfBirth: dob,
        age,
        gender,
        genderPreference: genderPref,
      });

      await refreshProfile();
      router.replace('/onboarding/profile-setup');
    } catch (e: any) {
      setError(e?.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Create Account" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Join the Community</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Walk With Buddy is an 18+ platform designed for safe, respectful social connections.
        </Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Display Name"
          placeholder="e.g. Harsha Vardhan"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

        <Input
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password (min 6 characters)"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Input
          label="Date of Birth (YYYY-MM-DD)"
          placeholder="2000-01-15"
          value={dob}
          onChangeText={handleDobChange}
          helperText={`Age: ${age} years old (${age >= 18 ? 'Eligible' : 'Must be 18+'})`}
        />

        {/* Gender Identity */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            My Gender Identity:
          </Text>
          <View style={styles.chipsRow}>
            {GENDER_OPTIONS.map((opt) => {
              const selected = gender === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setGender(opt.id)}
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
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Discovery Gender Preference */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Who would you like to discover?
          </Text>
          <View style={styles.chipsRow}>
            {PREFERENCE_OPTIONS.map((opt) => {
              const selected = genderPref === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setGenderPref(opt.id)}
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
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Continue"
          onPress={handleRegister}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already registered?
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}> Log In</Text>
          </TouchableOpacity>
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
  title: {
    ...Typography.titleMedium,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.bodySmall,
  },
  loginLink: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});
