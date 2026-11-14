// ====================================================================
// CONVERSATIONAL MATCHING GUIDE (6-STEP QUESTIONNAIRE)
// ====================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { useTheme } from '../../src/context/ThemeContext';
import { useDiscovery } from '../../src/context/DiscoveryContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { APP_CONFIG } from '../../src/constants/config';
import {
  ConversationalDiscoveryFilter,
  DiscoveryMode,
  DiscoveryRadius,
  GenderPreferenceType,
} from '../../src/types';

export default function ConversationalGuideScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { filter, setFilter } = useDiscovery();
  const params = useLocalSearchParams<{ initialMode?: DiscoveryMode }>();

  // Initialize draft questionnaire state from context or route params
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draft, setDraft] = useState<ConversationalDiscoveryFilter>({
    ...filter,
    mode: params.initialMode || filter.mode || 'surprise_me',
  });

  const totalSteps = 6;

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleFinish = () => {
    // Explicit user confirmation to start matching
    setFilter(draft);
    if (draft.mode === 'group_walk') {
      router.replace('/groups');
    } else {
      router.replace('/(tabs)');
    }
  };

  // Helper toggle functions
  const toggleActivity = (activityId: string) => {
    const exists = draft.activities.includes(activityId);
    if (exists) {
      setDraft((prev) => ({
        ...prev,
        activities: prev.activities.filter((a) => a !== activityId),
      }));
    } else {
      setDraft((prev) => ({
        ...prev,
        activities: [...prev.activities, activityId],
      }));
    }
  };

  const toggleProfession = (prof: string) => {
    const list = draft.selectedProfessions || [];
    const exists = list.includes(prof);
    if (exists) {
      setDraft((prev) => ({
        ...prev,
        selectedProfessions: list.filter((p) => p !== prof),
      }));
    } else {
      setDraft((prev) => ({
        ...prev,
        selectedProfessions: [...list, prof],
      }));
    }
  };

  return (
    <ScreenContainer>
      {/* Top Header & Progress */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.stepIndicator, { color: colors.primary }]}>
            Step {currentStep} of {totalSteps}
          </Text>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            {currentStep === 1 && 'Where to walk?'}
            {currentStep === 2 && "What's the plan?"}
            {currentStep === 3 && 'When are you free?'}
            {currentStep === 4 && 'Who to meet?'}
            {currentStep === 5 && 'What to discover?'}
            {currentStep === 6 && 'Review your plan'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarBg, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.primary,
              width: `${(currentStep / totalSteps) * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ================================================================= */}
        {/* QUESTION 1 — LOCATION & RADIUS */}
        {/* ================================================================= */}
        {currentStep === 1 && (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionHeadline, { color: colors.text }]}>
              Where should we find your buddy?
            </Text>
            <Text style={[styles.questionSub, { color: colors.textSecondary }]}>
              Choose how you want to discover buddies in Hyderabad.
            </Text>

            {/* Location Type Choice */}
            <View style={styles.optionsGrid}>
              <TouchableOpacity
                onPress={() => setDraft((prev) => ({ ...prev, locationType: 'current' }))}
                style={[
                  styles.choiceCard,
                  {
                    backgroundColor: draft.locationType === 'current' ? colors.primaryLight : colors.surface,
                    borderColor: draft.locationType === 'current' ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="navigate"
                  size={24}
                  color={draft.locationType === 'current' ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.choiceTitle,
                    { color: draft.locationType === 'current' ? colors.primaryDark : colors.text },
                  ]}
                >
                  Use my current location
                </Text>
                <Text style={[styles.choiceDesc, { color: colors.textMuted }]}>
                  Automatic proximity based on where you are right now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDraft((prev) => ({ ...prev, locationType: 'manual' }))}
                style={[
                  styles.choiceCard,
                  {
                    backgroundColor: draft.locationType === 'manual' ? colors.primaryLight : colors.surface,
                    borderColor: draft.locationType === 'manual' ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="map"
                  size={24}
                  color={draft.locationType === 'manual' ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.choiceTitle,
                    { color: draft.locationType === 'manual' ? colors.primaryDark : colors.text },
                  ]}
                >
                  Choose an area manually
                </Text>
                <Text style={[styles.choiceDesc, { color: colors.textMuted }]}>
                  Pick a specific neighborhood or hub in Hyderabad
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual Area Selection */}
            {draft.locationType === 'manual' && (
              <View style={styles.subSection}>
                <Text style={[styles.subLabel, { color: colors.text }]}>Select Hyderabad Locality:</Text>
                <View style={styles.chipsWrap}>
                  {APP_CONFIG.hyderabadLocalities.map((loc) => {
                    const selected = draft.manualArea === loc;
                    return (
                      <TouchableOpacity
                        key={loc}
                        onPress={() => setDraft((prev) => ({ ...prev, manualArea: loc }))}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? colors.primary : colors.surface,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Radius Selection */}
            <View style={styles.subSection}>
              <Text style={[styles.subLabel, { color: colors.text }]}>Search Radius:</Text>
              <View style={styles.chipsWrap}>
                {APP_CONFIG.radiusOptions.map((r) => {
                  const selected = draft.radiusKm === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setDraft((prev) => ({ ...prev, radiusKm: r as DiscoveryRadius }))}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="radio-button-on"
                        size={12}
                        color={selected ? '#FFFFFF' : colors.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                        {r} km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Privacy note */}
            <View style={[styles.safetyCallout, { backgroundColor: colors.surface }]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              <Text style={[styles.safetyCalloutText, { color: colors.textMuted }]}>
                Walk With Buddy never shares your exact home coordinates with other users. Only approximate distance is shown.
              </Text>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* QUESTION 2 — WHAT WOULD YOU LIKE TO DO? */}
        {/* ================================================================= */}
        {currentStep === 2 && (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionHeadline, { color: colors.text }]}>
              What's the plan?
            </Text>
            <Text style={[styles.questionSub, { color: colors.textSecondary }]}>
              Select one or more activities you feel like doing today.
            </Text>

            <View style={styles.verticalOptionsList}>
              {APP_CONFIG.discoveryActivities.map((act) => {
                const isSelected = draft.activities.includes(act.id);
                return (
                  <TouchableOpacity
                    key={act.id}
                    onPress={() => toggleActivity(act.id)}
                    style={[
                      styles.selectableRow,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.selectableRowLeft}>
                      <Ionicons
                        name={act.icon as any}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        style={[
                          styles.selectableRowText,
                          { color: isSelected ? colors.primaryDark : colors.text },
                        ]}
                      >
                        {act.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* QUESTION 3 — WHEN ARE YOU AVAILABLE? */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionHeadline, { color: colors.text }]}>
              When are you available?
            </Text>
            <Text style={[styles.questionSub, { color: colors.textSecondary }]}>
              Let us know when you'd like to step out and walk.
            </Text>

            <View style={styles.verticalOptionsList}>
              {[
                { id: 'now', title: 'Right now', sub: 'Ready to head out within 30 minutes' },
                { id: 'few_hours', title: 'Within the next few hours', sub: 'Later this morning or afternoon' },
                { id: 'today', title: 'Today (Evening / Sunset)', sub: 'Typical 5:30 PM - 8:00 PM walk' },
                { id: 'tomorrow', title: 'Tomorrow', sub: 'Planning ahead for morning or evening' },
                { id: 'scheduled', title: 'Weekend or flexible', sub: 'Open to planning over the weekend' },
              ].map((timeOption) => {
                const isSelected = draft.timeframe === timeOption.id;
                return (
                  <TouchableOpacity
                    key={timeOption.id}
                    onPress={() => setDraft((prev) => ({ ...prev, timeframe: timeOption.id as any }))}
                    style={[
                      styles.selectableRow,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.selectableRowLeft}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                      <View>
                        <Text
                          style={[
                            styles.selectableRowText,
                            { color: isSelected ? colors.primaryDark : colors.text },
                          ]}
                        >
                          {timeOption.title}
                        </Text>
                        <Text style={[styles.choiceDesc, { color: colors.textMuted }]}>
                          {timeOption.sub}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* QUESTION 4 — WHO WOULD YOU LIKE TO MEET? */}
        {/* ================================================================= */}
        {currentStep === 4 && (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionHeadline, { color: colors.text }]}>
              Who would you like to meet?
            </Text>
            <Text style={[styles.questionSub, { color: colors.textSecondary }]}>
              All members are age-verified adults (18+). Preferences are mutually verified.
            </Text>

            {/* Age Range */}
            <View style={styles.subSection}>
              <Text style={[styles.subLabel, { color: colors.text }]}>Preferred Age Bracket:</Text>
              <View style={styles.chipsWrap}>
                {[
                  { min: 18, max: 28, label: '18 - 28' },
                  { min: 25, max: 40, label: '25 - 40' },
                  { min: 35, max: 55, label: '35 - 55' },
                  { min: 18, max: 99, label: 'All adults (18+)' },
                ].map((item) => {
                  const selected = draft.minAge === item.min && draft.maxAge === item.max;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => setDraft((prev) => ({ ...prev, minAge: item.min, maxAge: item.max }))}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Gender Preference */}
            <View style={styles.subSection}>
              <Text style={[styles.subLabel, { color: colors.text }]}>Gender Preference:</Text>
              <View style={styles.chipsWrap}>
                {[
                  { id: 'all', label: 'Open to all genders' },
                  { id: 'women', label: 'Women' },
                  { id: 'men', label: 'Men' },
                  { id: 'non_binary', label: 'Non-binary' },
                ].map((gen) => {
                  const selected = draft.genderPreference === gen.id;
                  return (
                    <TouchableOpacity
                      key={gen.id}
                      onPress={() => setDraft((prev) => ({ ...prev, genderPreference: gen.id as GenderPreferenceType }))}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                        {gen.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.noteText, { color: colors.textMuted }]}>
                Mutual safety rule: Buddies are only suggested if both users accept each other's preferences.
              </Text>
            </View>

            {/* Format: 1-on-1 vs Group */}
            <View style={styles.subSection}>
              <Text style={[styles.subLabel, { color: colors.text }]}>Walk Format:</Text>
              <View style={styles.chipsWrap}>
                {[
                  { id: 'individual', label: '1-on-1 buddy walk', icon: 'person' },
                  { id: 'group', label: 'Small group walk (3-6 people)', icon: 'people' },
                  { id: 'either', label: 'Open to either', icon: 'sparkles' },
                ].map((fmt) => {
                  const selected = draft.groupOrIndividual === fmt.id;
                  return (
                    <TouchableOpacity
                      key={fmt.id}
                      onPress={() => setDraft((prev) => ({ ...prev, groupOrIndividual: fmt.id as any }))}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={fmt.icon as any}
                        size={14}
                        color={selected ? '#FFFFFF' : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                        {fmt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* QUESTION 5 — WHAT WOULD YOU LIKE TO DISCOVER? */}
        {/* ================================================================= */}
        {currentStep === 5 && (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionHeadline, { color: colors.text }]}>
              Anything specific you're curious about?
            </Text>
            <Text style={[styles.questionSub, { color: colors.textSecondary }]}>
              Tailor the focus of your discovery or leave it open to serendipity.
            </Text>

            {/* Discovery Focus Chips */}
            <View style={styles.chipsWrap}>
              {[
                'Completely surprise me',
                'Someone from a specific profession',
                'Similar hobbies and interests',
                'Different life experiences',
                'New perspectives & ideas',
                'Startup / tech discussions',
              ].map((focus) => {
                const selected = draft.discoveryFocus === focus;
                return (
                  <TouchableOpacity
                    key={focus}
                    onPress={() => setDraft((prev) => ({ ...prev, discoveryFocus: focus }))}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                      {focus}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Profession Picker if selected or in profession mode */}
            {(draft.discoveryFocus === 'Someone from a specific profession' ||
              draft.mode === 'profession') && (
              <View style={styles.subSection}>
                <Text style={[styles.subLabel, { color: colors.text }]}>
                  Select Profession(s):
                </Text>
                <View style={styles.chipsWrap}>
                  {APP_CONFIG.popularProfessions.map((prof) => {
                    const isSelected = (draft.selectedProfessions || []).includes(prof);
                    return (
                      <TouchableOpacity
                        key={prof}
                        onPress={() => toggleProfession(prof)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? colors.primaryDark : colors.text },
                          ]}
                        >
                          {prof}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Optional Note */}
            <View style={styles.subSection}>
              <Text style={[styles.subLabel, { color: colors.text }]}>
                Optional note or vibe (Optional):
              </Text>
              <TextInput
                value={draft.additionalNotes || ''}
                onChangeText={(text) => setDraft((prev) => ({ ...prev, additionalNotes: text }))}
                placeholder="e.g. Training for a 5k, looking for good coffee recs, etc."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                maxLength={120}
              />
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* QUESTION 6 — REVIEW & CONFIRM */}
        {/* ================================================================= */}
        {currentStep === 6 && (
          <View style={styles.questionBlock}>
            <Text style={[styles.questionHeadline, { color: colors.text }]}>
              Review your walk criteria
            </Text>
            <Text style={[styles.questionSub, { color: colors.textSecondary }]}>
              Here is a summary of what you're looking for today.
            </Text>

            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryRowLeft}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Location & Radius:</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {draft.locationType === 'current' ? 'Current GPS' : draft.manualArea} • {draft.radiusKm} km
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryRowLeft}>
                  <Ionicons name="footsteps-outline" size={18} color={colors.primary} />
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Plan / Activities:</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {draft.activities.length > 0 ? `${draft.activities.length} activities chosen` : 'Casual walk'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryRowLeft}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Timing:</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {draft.timeframe === 'now' ? 'Right now' : draft.timeframe === 'few_hours' ? 'Next few hours' : 'Today'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryRowLeft}>
                  <Ionicons name="people-outline" size={18} color={colors.primary} />
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Who:</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  Age {draft.minAge}-{draft.maxAge} • {draft.genderPreference === 'all' ? 'All Genders' : draft.genderPreference}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryRowLeft}>
                  <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Discovery Focus:</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {draft.discoveryFocus || 'Surprise me'}
                </Text>
              </View>

              {draft.selectedProfessions && draft.selectedProfessions.length > 0 && (
                <View style={styles.summaryRow}>
                  <View style={styles.summaryRowLeft}>
                    <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Professions:</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {draft.selectedProfessions.join(', ')}
                  </Text>
                </View>
              )}
            </Card>

            <TouchableOpacity
              onPress={() => setCurrentStep(1)}
              style={styles.editLinkBtn}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={[styles.editLinkText, { color: colors.primary }]}>
                Change any answers
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {currentStep < totalSteps ? (
          <Button
            title="Continue"
            onPress={handleNext}
            variant="primary"
            style={styles.continueBtn}
          />
        ) : (
          <Button
            title="Start Matching Now"
            onPress={handleFinish}
            variant="primary"
            style={styles.continueBtn}
            icon={<Ionicons name="sparkles" size={18} color="#FFFFFF" />}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  stepIndicator: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  progressBarBg: {
    height: 4,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  questionBlock: {
    flex: 1,
  },
  questionHeadline: {
    ...Typography.titleLarge,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  questionSub: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  optionsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  choiceCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  choiceTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  choiceDesc: {
    ...Typography.caption,
  },
  subSection: {
    marginBottom: Spacing.xl,
  },
  subLabel: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  safetyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  safetyCalloutText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  verticalOptionsList: {
    gap: Spacing.sm,
  },
  selectableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  selectableRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectableRowText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  noteText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
  },
  summaryCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  summaryValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  editLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  editLinkText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  continueBtn: {
    width: '100%',
  },
});
