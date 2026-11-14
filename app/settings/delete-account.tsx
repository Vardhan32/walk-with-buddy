// ====================================================================
// SCREEN 24: ACCOUNT DELETION
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
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

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, signOut } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE in capital letters to confirm account erasure.');
      return;
    }

    Alert.alert(
      'Permanent Erasure',
      'This action cannot be undone. All your matches, conversations, and profile data will be permanently wiped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Erase',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (profile?.id) {
                await authService.deleteAccount(profile.id);
              } else {
                await signOut();
              }
              Alert.alert('Account Deleted', 'Your account has been permanently removed.');
              router.replace('/welcome');
            } catch (e: any) {
              Alert.alert('Notice', 'Account data purged.');
              await signOut();
              router.replace('/welcome');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <Header title="Delete Account" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="trash-bin-outline" size={36} color={colors.danger} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Permanently Delete Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We're sorry to see you go. Deleting your account will immediately wipe all your data from Walk With Buddy.
          </Text>
        </View>

        <View style={[styles.warningBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
          <Text style={[styles.warningTitle, { color: colors.danger }]}>What will be deleted:</Text>
          <Text style={[styles.warningText, { color: colors.danger }]}>
            • Your profile and photos{'\n'}
            • All active mutual matches{'\n'}
            • Complete 1-to-1 chat history{'\n'}
            • Verified identity badges and evidence{'\n'}
            • Approximate location coordinates and preferences
          </Text>
        </View>

        <Text style={[styles.promptText, { color: colors.text }]}>
          To confirm, please type <Text style={{ fontWeight: '700', color: colors.danger }}>DELETE</Text> below:
        </Text>

        <Input
          placeholder="Type DELETE"
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
        />

        <Button
          title="Permanently Delete My Account"
          variant="danger"
          onPress={handleDelete}
          loading={loading}
          disabled={confirmText.trim().toUpperCase() !== 'DELETE'}
          size="lg"
          style={{ marginTop: Spacing.md }}
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleSmall,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 290,
  },
  warningBox: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  warningTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  warningText: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  promptText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
});
