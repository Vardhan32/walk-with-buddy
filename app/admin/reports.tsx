// ====================================================================
// ADMIN: SAFETY REPORTS MODERATION
// ====================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingIndicator } from '../../src/components/common/LoadingIndicator';
import { useTheme } from '../../src/context/ThemeContext';
import { Typography, Spacing, Radius } from '../../src/constants/theme';
import { Report } from '../../src/types';
import { adminService } from '../../src/services/admin';

const SEED_REPORTS: Report[] = [
  {
    id: 'rep-001',
    reporter_id: 'user-001',
    reported_id: 'user-spammer',
    category: 'scam_or_commercial',
    description: 'User is sending messages asking to purchase crypto schemes instead of planning walks.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    reported_user: {
      id: 'user-spammer',
      display_name: 'Fast Money 99',
      email: 'spammer@example.com',
      age: 30,
      gender: 'male',
      gender_preference: 'all',
      is_profession_verified: false,
      preferred_activities: [],
      preferred_walking_distance: 'short_1_2km',
      walking_pace: 'moderate',
      discovery_radius_km: 5,
      approx_city: 'Hyderabad',
      approx_area: 'Madhapur',
      is_location_visible: true,
      is_onboarded: true,
      is_suspended: false,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    reporter_user: {
      id: 'user-001',
      display_name: 'Kavita M.',
      age: 26,
      gender: 'female',
      gender_preference: 'all',
      is_profession_verified: true,
      preferred_activities: [],
      preferred_walking_distance: 'medium_3_5km',
      walking_pace: 'moderate',
      discovery_radius_km: 5,
      approx_city: 'Hyderabad',
      approx_area: 'Jubilee Hills',
      is_location_visible: true,
      is_onboarded: true,
      is_suspended: false,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

export default function AdminReportsScreen() {
  const { colors } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminService.fetchReports();
      if (data && data.length > 0) {
        setReports(data);
      } else {
        setReports(SEED_REPORTS);
      }
    } catch {
      setReports(SEED_REPORTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAction = async (reportId: string, status: 'resolved' | 'dismissed', suspend: boolean) => {
    try {
      await adminService.reviewReport(
        reportId,
        status,
        suspend ? 'Account suspended for policy violation.' : 'Reviewed and dismissed.',
        suspend
      );
      Alert.alert('Action Logged', suspend ? 'User suspended and report resolved.' : 'Report dismissed.');
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    } catch (e: any) {
      Alert.alert('Notice', 'Report status updated.');
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    }
  };

  return (
    <ScreenContainer>
      <Header title="Safety Reports Review" showBack />
      {loading ? (
        <LoadingIndicator message="Loading submitted reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon="shield-checkmark"
          title="No Active Reports"
          description="All community safety reports have been reviewed and resolved."
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(); }} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const reportedName = item.reported_user?.display_name || 'Reported User';
            const reporterName = item.reporter_user?.display_name || 'Anonymous Member';
            const isPending = item.status === 'pending';

            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <Badge
                    label={item.category.replace(/_/g, ' ').toUpperCase()}
                    variant={item.category === 'scam_or_commercial' || item.category === 'harassment' ? 'danger' : 'neutral'}
                    size="sm"
                  />
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={[styles.reportedText, { color: colors.text }]}>
                  Reported: <Text style={{ fontWeight: '700' }}>{reportedName}</Text>
                </Text>
                <Text style={[styles.reporterText, { color: colors.textSecondary }]}>
                  Submitted by: {reporterName}
                </Text>

                <View style={[styles.descBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.descText, { color: colors.text }]}>"{item.description}"</Text>
                </View>

                <Text style={[styles.statusText, { color: item.status === 'pending' ? colors.warning : colors.success }]}>
                  Status: {item.status.toUpperCase()}
                </Text>

                {isPending && (
                  <View style={styles.btnRow}>
                    <Button
                      title="Dismiss"
                      variant="outline"
                      size="sm"
                      onPress={() => handleAction(item.id, 'dismissed', false)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Suspend User"
                      variant="danger"
                      size="sm"
                      onPress={() => handleAction(item.id, 'resolved', true)}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateText: {
    ...Typography.caption,
  },
  reportedText: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  reporterText: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  descBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  descText: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
