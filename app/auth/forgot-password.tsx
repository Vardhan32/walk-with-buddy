// ====================================================================
// SCREEN 6: FORGOT PASSWORD
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { authService } from '../../src/services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(email.trim());
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Notice', e?.message || 'Password reset requested.');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Reset Password" showBack />
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="key-outline" size={36} color={colors.primaryDark} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Forgot your password?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your registered email address and we'll send you instructions to reset your password.
        </Text>

        {submitted ? (
          <View style={[styles.successBox, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
            <Text style={[styles.successTitle, { color: colors.text }]}>Check your inbox</Text>
            <Text style={[styles.successText, { color: colors.textMuted }]}>
              We sent a password reset link to {email}. Follow the instructions in the email.
            </Text>
            <Button
              title="Return to Login"
              onPress={() => router.replace('/auth/login')}
              style={{ marginTop: Spacing.lg, width: '100%' }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title="Send Reset Instructions"
              onPress={handleReset}
              loading={loading}
              size="lg"
            />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  title: {
    ...Typography.titleSmall,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: Spacing.xxl,
  },
  form: {
    width: '100%',
  },
  successBox: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  successTitle: {
    ...Typography.titleSmall,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  successText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
  },
});
