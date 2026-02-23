import React, {useLayoutEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useMedications, useDeactivateMedication} from '../../hooks/useMedications';
import {Medication} from '../../types/medication';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'MedicationList'>;
  route: RouteProp<RootStackParamList, 'MedicationList'>;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function MedicationCard({
  med,
  onEdit,
  onDeactivate,
}: {
  med: Medication;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const isOngoing = !med.end_date;
  const isExpired =
    med.end_date && new Date(med.end_date) < new Date();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Text style={styles.cardIcon}>💊</Text>
        </View>
        <View style={styles.cardTitles}>
          <Text style={styles.medName}>{med.name}</Text>
          <Text style={styles.medDosage}>
            {med.dosage} · {med.frequency}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            med.active ? styles.badgeActive : styles.badgeInactive,
          ]}>
          <Text
            style={[
              styles.statusBadgeText,
              med.active ? styles.badgeActiveText : styles.badgeInactiveText,
            ]}>
            {med.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDates}>
        <Text style={styles.dateText}>
          From {formatDate(med.start_date)}
        </Text>
        {isOngoing ? (
          <View style={styles.ongoingBadge}>
            <Text style={styles.ongoingText}>Ongoing</Text>
          </View>
        ) : (
          <Text style={styles.dateText}>
            {isExpired ? 'Ended' : 'Until'} {formatDate(med.end_date!)}
          </Text>
        )}
      </View>

      {med.instructions ? (
        <Text style={styles.instructions} numberOfLines={2}>
          📋 {med.instructions}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        {med.active && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.deactivateBtn]}
            onPress={onDeactivate}>
            <Text style={styles.deactivateBtnText}>Deactivate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function MedicationListScreen({navigation, route}: Props) {
  const {patientId, patientName} = route.params;
  const [activeOnly, setActiveOnly] = useState(true);

  const {
    data: medications,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useMedications(patientId, activeOnly);

  const {mutate: deactivate} = useDeactivateMedication();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: patientName,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() =>
            navigation.navigate('AddEditMedication', {patientId})
          }>
          <Text style={styles.headerAddText}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, patientId, patientName]);

  const handleDeactivate = (med: Medication) => {
    Alert.alert(
      'Deactivate Medication',
      `Stop tracking "${med.name}" for this patient?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivate(med.id!),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Loading medications…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load medications</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Active / All toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeOnly && styles.toggleBtnActive]}
          onPress={() => setActiveOnly(true)}>
          <Text
            style={[
              styles.toggleText,
              activeOnly && styles.toggleTextActive,
            ]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !activeOnly && styles.toggleBtnActive]}
          onPress={() => setActiveOnly(false)}>
          <Text
            style={[
              styles.toggleText,
              !activeOnly && styles.toggleTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          (!medications || medications.length === 0) && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={COLORS.secondary}
          />
        }>
        {!medications || medications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>💊</Text>
            <Text style={styles.emptyTitle}>
              {activeOnly ? 'No active medications' : 'No medications'}
            </Text>
            <Text style={styles.emptySub}>
              {activeOnly
                ? 'Switch to "All" to see inactive ones, or tap + Add.'
                : 'Tap + Add to add the first medication.'}
            </Text>
          </View>
        ) : (
          (medications ?? []).map((item, index) => (
            <View key={item.id ?? item.name}>
              <MedicationCard
                med={item}
                onEdit={() =>
                  navigation.navigate('AddEditMedication', {
                    patientId,
                    medicationId: item.id,
                  })
                }
                onDeactivate={() => handleDeactivate(item)}
              />
              {index < medications.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditMedication', {patientId})}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  loadingText: {marginTop: SPACING.sm, color: COLORS.textSecondary, fontSize: 14},
  errorTitle: {fontSize: 16, fontWeight: '600', color: COLORS.error, marginBottom: SPACING.lg},
  retryBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},

  headerAddBtn: {marginRight: SPACING.md},
  headerAddText: {color: COLORS.white, fontSize: 15, fontWeight: '600'},

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    margin: SPACING.lg,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {backgroundColor: COLORS.white},
  toggleText: {fontSize: 14, fontWeight: '500', color: COLORS.textSecondary},
  toggleTextActive: {color: COLORS.secondary, fontWeight: '700'},

  // List
  list: {flex: 1},
  listContent: {paddingHorizontal: SPACING.lg, paddingBottom: 90},
  listEmpty: {flex: 1, justifyContent: 'center'},

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm},
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  cardIcon: {fontSize: 20},
  cardTitles: {flex: 1},
  medName: {fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2},
  medDosage: {fontSize: 13, color: COLORS.textSecondary},

  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeActive: {backgroundColor: COLORS.success + '20'},
  badgeInactive: {backgroundColor: COLORS.border},
  statusBadgeText: {fontSize: 11, fontWeight: '700'},
  badgeActiveText: {color: COLORS.success},
  badgeInactiveText: {color: COLORS.textSecondary},

  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  dateText: {fontSize: 12, color: COLORS.textSecondary},
  ongoingBadge: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ongoingText: {fontSize: 11, color: COLORS.primary, fontWeight: '600'},

  instructions: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },

  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtn: {backgroundColor: COLORS.secondary + '15'},
  editBtnText: {fontSize: 13, fontWeight: '600', color: COLORS.secondary},
  deactivateBtn: {backgroundColor: COLORS.error + '12'},
  deactivateBtnText: {fontSize: 13, fontWeight: '600', color: COLORS.error},

  separator: {height: SPACING.sm},

  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  emptyTitle: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  emptySub: {fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18},

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {fontSize: 28, color: COLORS.white, lineHeight: 32},
});
