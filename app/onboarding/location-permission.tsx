// ====================================================================
// SCREEN 9: LOCATION PERMISSION & PRIVACY ONBOARDING
// ====================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { HYDERABAD_AREAS } from '../../src/constants/interests';
import { locationService } from '../../src/services/location';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateCurrentProfile } = useAuth();

  const [selectedArea, setSelectedArea] = useState('Hitec City');
  const [loading, setLoading] = useState(false);

  const handleAllowLocation = async () => {
    try {
      setLoading(true);
      const granted = await locationService.requestPermission();
      if (granted) {
        const coords = await locationService.getCoordinates();
        if (coords) {
          const area = await locationService.getApproximateAreaName(coords.latitude, coords.longitude);
          await locationService.syncLocationToServer(coords.latitude, coords.longitude, area);
          await updateCurrentProfile({
            latitude: coords.latitude,
            longitude: coords.longitude,
            approx_area: area,
            is_onboarded: true,
          });
        } else {
          await updateCurrentProfile({
            approx_area: selectedArea,
            is_onboarded: true,
          });
        }
      } else {
        await updateCurrentProfile({
          approx_area: selectedArea,
          is_onboarded: true,
        });
      }
      router.replace('/(tabs)');
    } catch {
      await updateCurrentProfile({
        approx_area: selectedArea,
        is_onboarded: true,
      });
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSelection = async () => {
    try {
      setLoading(true);
      await updateCurrentProfile({
        approx_area: selectedArea,
        is_onboarded: true,
      });
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Location & Privacy (Step 3 of 3)" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="location" size={48} color={colors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Enable Approximate Location</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Walk With Buddy needs to know your general area in Hyderabad to discover nearby buddies.
          </Text>
        </View>

        {/* Privacy Guarantees Box */}
        <View style={[styles.privacyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.privacyTitle, { color: colors.text }]}>Our Privacy Guarantees</Text>

          <View style={styles.guaranteeRow}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} style={styles.gIcon} />
            <Text style={[styles.gText, { color: colors.textSecondary }]}>
              Exact GPS coordinates are <Text style={{ fontWeight: '700' }}>never</Text> displayed to other users.
            </Text>
          </View>

          <View style={styles.guaranteeRow}>
            <Ionicons name="eye-off-outline" size={18} color={colors.primary} style={styles.gIcon} />
            <Text style={[styles.gText, { color: colors.textSecondary }]}>
              Only approximate distances (e.g., "~2.5 km away") and neighbourhood names are shared.
            </Text>
          </View>

          <View style={styles.guaranteeRow}>
            <Ionicons name="battery-charging-outline" size={18} color={colors.primary} style={styles.gIcon} />
            <Text style={[styles.gText, { color: colors.textSecondary }]}>
              Zero background battery drain: location is checked only when actively using discovery.
            </Text>
          </View>
        </View>

        {/* Manual Fallback Area Picker */}
        <View style={styles.manualSection}>
          <Text style={[styles.manualLabel, { color: colors.textSecondary }]}>
            Or pick your primary Hyderabad neighbourhood:
          </Text>
          <View style={styles.chipsRow}>
            {HYDERABAD_AREAS.slice(0, 8).map((area) => {
              const selected = selectedArea === area;
              return (
                <TouchableOpacity
                  key={area}
                  onPress={() => setSelectedArea(area)}
                  style={[
                    styles.areaChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.areaText,
                      { color: selected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.ctaGroup}>
          <Button
            title="Allow Location Access"
            onPress={handleAllowLocation}
            loading={loading}
            size="lg"
            icon={<Ionicons name="navigate" size={18} color="#FFFFFF" />}
            style={styles.allowBtn}
          />

          <Button
            title={`Set Area to ${selectedArea} & Continue`}
            variant="outline"
            onPress={handleManualSelection}
            size="md"
          />
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
  topSection: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    lineHeight: 20,
  },
  privacyBox: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginVertical: Spacing.lg,
  },
  privacyTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  gIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  gText: {
    ...Typography.bodySmall,
    flex: 1,
    lineHeight: 18,
  },
  manualSection: {
    marginBottom: Spacing.xl,
  },
  manualLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  areaText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  ctaGroup: {
    marginTop: Spacing.sm,
  },
  allowBtn: {
    marginBottom: Spacing.md,
  },
});
