// ====================================================================
// SCREEN 17: EDIT USER PROFILE
// ====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Avatar } from '../../src/components/common/Avatar';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { APP_CONFIG } from '../../src/constants/config';
import { PREFERRED_ACTIVITIES } from '../../src/constants/interests';
import { WalkingDistancePref, WalkingPace, DiscoveryRadius } from '../../src/types';
import { profileService } from '../../src/services/profile';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, updateCurrentProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || 'Harsha Vardhan');
  const [profession, setProfession] = useState(profile?.profession || 'Software Engineer');
  const [bio, setBio] = useState(profile?.bio || 'Tech enthusiast and Hyderabad explorer.');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [distancePref, setDistancePref] = useState<WalkingDistancePref>(
    profile?.preferred_walking_distance || 'medium_3_5km'
  );
  const [pace, setPace] = useState<WalkingPace>(profile?.walking_pace || 'moderate');
  const [radius, setRadius] = useState<DiscoveryRadius>(profile?.discovery_radius_km || 5);
  const [activities, setActivities] = useState<string[]>(
    profile?.preferred_activities || ['evening_stroll', 'tech_talk', 'coffee_chat']
  );
  const [saving, setSaving] = useState(false);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setAvatarUrl(pickedUri);
        if (profile?.id) {
          await profileService.uploadAvatar(profile.id, pickedUri);
        }
      }
    } catch (e: any) {
      Alert.alert('Image Picker', 'Could not access photo library.');
    }
  };

  const toggleActivity = (id: string) => {
    setActivities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      await updateCurrentProfile({
        display_name: displayName.trim(),
        profession: profession.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        preferred_walking_distance: distancePref,
        walking_pace: pace,
        discovery_radius_km: radius,
        preferred_activities: activities,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Edit Profile" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarBtn}>
            <Avatar
              url={avatarUrl}
              name={displayName}
              size="xl"
              isVerified={profile?.is_profession_verified}
            />
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarTip, { color: colors.textMuted }]}>
            Tap to upload new profile photo
          </Text>
        </View>

        {/* Basic Fields */}
        <Input
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Input
          label="Profession / Occupation"
          value={profession}
          onChangeText={setProfession}
          helperText="Request a verified badge from Settings to verify this."
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />

        {/* Discovery Radius */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Discovery Radius (Hyderabad):
          </Text>
          <View style={styles.chipsRow}>
            {APP_CONFIG.radiusOptions.map((r) => {
              const selected = radius === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRadius(r)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Walking Distance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Preferred Walking Distance:
          </Text>
          <View style={styles.chipsRow}>
            {APP_CONFIG.walkingDistances.map((d) => {
              const selected = distancePref === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => setDistancePref(d.id as WalkingDistancePref)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Walking Pace */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Walking Pace:
          </Text>
          <View style={styles.chipsRow}>
            {APP_CONFIG.walkingPaces.map((p) => {
              const selected = pace === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPace(p.id as WalkingPace)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Activities */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Preferred Activities:
          </Text>
          <View style={styles.chipsRow}>
            {PREFERRED_ACTIVITIES.map((act) => {
              const selected = activities.includes(act.id);
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
                  <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                    {act.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={{ marginTop: Spacing.md, marginBottom: Spacing.xxl }}
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  avatarBtn: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarTip: {
    ...Typography.caption,
    marginTop: Spacing.sm,
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
});
