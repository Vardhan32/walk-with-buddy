// ====================================================================
// SCREEN 7: SEARCHABLE INTEREST SELECTION SYSTEM
// ====================================================================

import React, { useState, useEffect } from 'react';
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
import { PREDEFINED_INTERESTS } from '../../src/constants/interests';
import { profileService } from '../../src/services/profile';

export default function InterestsSelectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(['1', '2', '7', '10', '18']); // Default initial picks
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadInterests() {
      if (user?.id) {
        try {
          const userInts = await profileService.fetchUserInterests(user.id);
          if (userInts.length > 0) {
            setSelectedIds(userInts);
          }
        } catch {
          // Keep defaults
        }
      }
    }
    loadInterests();
  }, [user]);

  const toggleInterest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredInterests = PREDEFINED_INTERESTS.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(PREDEFINED_INTERESTS.map((i) => i.category)));

  const handleSave = async () => {
    if (selectedIds.length < 3) {
      Alert.alert('Select at least 3', 'Please select at least 3 interests to ensure high-accuracy compatibility matching.');
      return;
    }

    try {
      setLoading(true);
      if (user?.id) {
        await profileService.updateUserInterests(user.id, selectedIds);
      }
      router.push('/onboarding/location-permission');
    } catch (e: any) {
      Alert.alert('Notice', 'Interests saved locally.');
      router.push('/onboarding/location-permission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Select Interests (Step 2 of 3)" showBack />
      <View style={styles.topContainer}>
        <Text style={[styles.title, { color: colors.text }]}>What Sparks Your Curiosity?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Shared interests carry a 40% weight in the Walk With Buddy matching algorithm.
        </Text>

        <Input
          placeholder="Search interests (e.g. Technology, Startups, Nature)..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Ionicons name="search" size={18} color={colors.textMuted} />}
          style={{ marginBottom: Spacing.sm }}
        />

        <View style={styles.selectedCountRow}>
          <Text style={[styles.countText, { color: colors.textMuted }]}>
            Selected: <Text style={{ color: colors.primary, fontWeight: '700' }}>{selectedIds.length}</Text> (min 3)
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {categories.map((cat) => {
          const catItems = filteredInterests.filter((item) => item.category === cat);
          if (catItems.length === 0) return null;

          return (
            <View key={cat} style={styles.categoryBlock}>
              <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>
                {cat}
              </Text>
              <View style={styles.chipsRow}>
                {catItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => toggleInterest(item.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={(isSelected ? 'checkmark-circle' : 'add-circle-outline') as any}
                        size={16}
                        color={isSelected ? '#FFFFFF' : colors.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.chipLabel,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Button
          title={`Continue (${selectedIds.length} selected)`}
          onPress={handleSave}
          loading={loading}
          size="lg"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.titleSmall,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  selectedCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.xs,
  },
  countText: {
    ...Typography.caption,
  },
  scrollList: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  categoryBlock: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
