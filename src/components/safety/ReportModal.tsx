// ====================================================================
// WALK WITH BUDDY - REPORT USER MODAL
// ====================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ReportCategory } from '../../types';
import { safetyService } from '../../services/safety';

interface ReportModalProps {
  visible: boolean;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_CATEGORIES: { id: ReportCategory; label: string; desc: string }[] = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Threatening or unwelcome comments' },
  { id: 'inappropriate_content', label: 'Inappropriate Content', desc: 'Offensive images or explicit messages' },
  { id: 'fake_profile', label: 'Fake / Impersonation', desc: 'Pretending to be someone else or stolen photos' },
  { id: 'scam_or_commercial', label: 'Scam or Commercial Solicitation', desc: 'Selling products, paid services or begging' },
  { id: 'safety_concern', label: 'Safety or Dangerous Conduct', desc: 'Immediate physical safety concern or stalking' },
  { id: 'spam', label: 'Spam', desc: 'Repetitive unwanted messaging' },
  { id: 'other', label: 'Other Concern', desc: 'Any other issue not listed above' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  targetUserId,
  targetUserName,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const [category, setCategory] = useState<ReportCategory>('harassment');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please provide a short description of the issue.');
      return;
    }

    try {
      setSubmitting(true);
      await safetyService.reportUser(targetUserId, category, description.trim());
      Alert.alert(
        'Report Submitted',
        `Thank you for keeping our community safe. Our moderation team will review your report against ${targetUserName}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Could not submit report at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Report {targetUserName}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Your report is confidential.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Reason for reporting:
            </Text>
            {REPORT_CATEGORIES.map((item) => {
              const selected = category === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  style={[
                    styles.categoryItem,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selected ? colors.primaryDark : colors.textMuted}
                    style={{ marginRight: Spacing.sm }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.catLabel,
                        { color: selected ? colors.primaryDark : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[styles.catDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <Input
              label="Additional Details"
              placeholder="Explain what happened to help our moderation team investigate..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Submit Report"
              variant="danger"
              onPress={handleSubmit}
              loading={submitting}
              style={{ marginTop: Spacing.sm, marginBottom: Spacing.xxl }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.titleSmall,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  body: {
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  catLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  catDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
});
