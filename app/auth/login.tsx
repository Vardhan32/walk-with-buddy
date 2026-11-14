// ====================================================================
// SCREEN 5: USER LOGIN
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { authService } from '../../src/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    try {
      setLoading(true);
      await authService.signIn(email.trim(), password);
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Invalid credentials or network issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    // Quick preview mode
    await refreshProfile();
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer>
      <Header title="Welcome Back" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topIconSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="log-in-outline" size={36} color={colors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Log In</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Continue finding buddies and exploring Hyderabad.
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Email Address"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => router.push('/auth/forgot-password')}
          style={styles.forgotBtn}
        >
          <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />

        <Button
          title="Explore in Demo Mode"
          variant="outline"
          onPress={handleDemoLogin}
          size="md"
          style={styles.demoBtn}
        />

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.registerLink, { color: colors.primary }]}> Sign Up</Text>
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
  topIconSection: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleMedium,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 280,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  submitBtn: {
    marginBottom: Spacing.md,
  },
  demoBtn: {
    marginBottom: Spacing.xl,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.bodySmall,
  },
  registerLink: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});
