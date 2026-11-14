// ====================================================================
// SCREEN 20: BLOCKED USERS MANAGEMENT
// ====================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Avatar } from '../../src/components/common/Avatar';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingIndicator } from '../../src/components/common/LoadingIndicator';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { BlockRecord } from '../../src/types';
import { safetyService } from '../../src/services/safety';

export default function BlockListScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();

  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlocks = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await safetyService.fetchBlockedUsers(profile.id);
      setBlocks(data);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [profile?.id]);

  const handleUnblock = (blockId: string, name: string) => {
    Alert.alert('Unblock User', `Are you sure you want to unblock ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await safetyService.unblockUser(blockId);
            setBlocks((prev) => prev.filter((b) => b.id !== blockId));
            Alert.alert('Success', `${name} has been unblocked.`);
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not unblock user.');
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <Header title="Blocked Users" showBack />
      <View style={styles.container}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Blocked users cannot discover your profile, send you likes, or message you.
        </Text>

        {loading ? (
          <LoadingIndicator message="Loading blocked users..." />
        ) : blocks.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="No Blocked Users"
            description="You haven't blocked anyone. If someone makes you uncomfortable, you can block them from their profile or chat."
          />
        ) : (
          <FlatList
            data={blocks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const name = item.blocked_user?.display_name || 'User';
              return (
                <View
                  style={[
                    styles.blockRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Avatar
                    url={item.blocked_user?.avatar_url}
                    name={name}
                    size="md"
                  />
                  <View style={styles.blockInfo}>
                    <Text style={[styles.blockName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.blockReason, { color: colors.textMuted }]}>
                      {item.reason || 'User requested block'}
                    </Text>
                  </View>
                  <Button
                    title="Unblock"
                    variant="outline"
                    size="sm"
                    onPress={() => handleUnblock(item.id, name)}
                  />
                </View>
              );
            }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  infoText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  blockInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  blockName: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  blockReason: {
    ...Typography.caption,
    marginTop: 2,
  },
});
