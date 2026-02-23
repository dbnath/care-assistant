import React, {useLayoutEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {
  useAppointments,
  useCompleteAppointment,
  useCancelAppointment,
} from '../../hooks/useAppointments';
import {Appointment} from '../../types/appointment';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AppointmentList'>;
  route: RouteProp<RootStackParamList, 'AppointmentList'>;
};

type TabKey = 'upcoming' | 'all' | 'completed';

const TYPE_COLORS: Record<string, string> = {
  general: COLORS.primary,
  specialist: COLORS.secondary,
  dental: '#00B894',
  therapy: '#E17055',
  'follow-up': COLORS.warning,
  emergency: COLORS.error,
  other: COLORS.textSecondary,
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? COLORS.textSecondary;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function isPast(iso: string): boolean {
  return new Date(iso) < new Date();
}

// ── Appointment card ──────────────────────────────────────────────────────────
function AppointmentCard({
  appt,
  onEdit,
  onComplete,
  onCancel,
  completing,
  completingNotes,
  onNotesChange,
  onConfirmComplete,
  onCancelComplete,
}: {
  appt: Appointment;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
  completing: boolean;
  completingNotes: string;
  onNotesChange: (v: string) => void;
  onConfirmComplete: () => void;
  onCancelComplete: () => void;
}) {
  const typeColor = getTypeColor(appt.appointment_type);
  const past = isPast(appt.scheduled_at);

  return (
    <View style={[styles.card, appt.completed && styles.cardCompleted]}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, {backgroundColor: typeColor + '20'}]}>
          <Text style={[styles.typeBadgeText, {color: typeColor}]}>
            {appt.appointment_type.charAt(0).toUpperCase() +
              appt.appointment_type.slice(1)}
          </Text>
        </View>
        {appt.completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Done</Text>
          </View>
        )}
        {!appt.completed && past && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueBadgeText}>Overdue</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{appt.title}</Text>
      {appt.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {appt.description}
        </Text>
      ) : null}

      {/* Date / time / duration */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          📅 {formatDate(appt.scheduled_at)} · {formatTime(appt.scheduled_at)}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>⏱ {appt.duration_minutes} min</Text>
        {appt.location ? (
          <Text style={styles.metaText}>  📍 {appt.location}</Text>
        ) : null}
      </View>

      {/* Completion notes */}
      {appt.completed && appt.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{appt.notes}</Text>
        </View>
      ) : null}

      {/* Inline complete form */}
      {completing && (
        <View style={styles.completeForm}>
          <Text style={styles.completeFormLabel}>Add completion notes (optional)</Text>
          <TextInput
            style={styles.completeFormInput}
            value={completingNotes}
            onChangeText={onNotesChange}
            placeholder="e.g. Patient responded well…"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            autoFocus
          />
          <View style={styles.completeFormActions}>
            <TouchableOpacity
              style={styles.confirmCompleteBtn}
              onPress={onConfirmComplete}>
              <Text style={styles.confirmCompleteBtnText}>✓ Confirm Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelCompleteBtn}
              onPress={onCancelComplete}>
              <Text style={styles.cancelCompleteBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Card actions */}
      {!appt.completed && !completing && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={onEdit}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={onComplete}>
            <Text style={styles.completeBtnText}>✓ Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelApptBtn]}
            onPress={onCancel}>
            <Text style={styles.cancelApptBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AppointmentListScreen({navigation, route}: Props) {
  const {patientId, patientName} = route.params;
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completingNotes, setCompletingNotes] = useState('');

  const {data: appointments, isLoading, isError, refetch, isFetching} =
    useAppointments(patientId);
  const {mutate: complete} = useCompleteAppointment();
  const {mutate: cancel} = useCancelAppointment();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: patientName,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() =>
            navigation.navigate('AddEditAppointment', {patientId})
          }>
          <Text style={styles.headerAddText}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, patientId, patientName]);

  const filtered = useMemo(() => {
    if (!appointments) {return [];}
    const now = new Date();
    switch (tab) {
      case 'upcoming':
        return appointments.filter(
          a => !a.completed && new Date(a.scheduled_at) >= now,
        );
      case 'completed':
        return appointments.filter(a => a.completed);
      default:
        return [...appointments].sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        );
    }
  }, [appointments, tab]);

  const handleComplete = (id: string) => {
    setCompletingId(id);
    setCompletingNotes('');
  };

  const handleConfirmComplete = (id: string) => {
    complete(
      {id, notes: completingNotes.trim() || undefined},
      {
        onSuccess: () => {
          setCompletingId(null);
          setCompletingNotes('');
        },
        onError: () => Alert.alert('Error', 'Failed to mark as complete.'),
      },
    );
  };

  const handleCancel = (appt: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel "${appt.title}"? This cannot be undone.`,
      [
        {text: 'Keep', style: 'cancel'},
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () =>
            cancel(appt.id!, {
              onError: () => Alert.alert('Error', 'Failed to cancel appointment.'),
            }),
        },
      ],
    );
  };

  // Tab counts
  const now = new Date();
  const upcomingCount = appointments?.filter(
    a => !a.completed && new Date(a.scheduled_at) >= now,
  ).length ?? 0;
  const completedCount = appointments?.filter(a => a.completed).length ?? 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.loadingText}>Loading appointments…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load appointments</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {(
          [
            {key: 'upcoming', label: 'Upcoming', count: upcomingCount},
            {key: 'all', label: 'All', count: appointments?.length ?? 0},
            {key: 'completed', label: 'Done', count: completedCount},
          ] as {key: TabKey; label: string; count: number}[]
        ).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  tab === t.key && styles.tabBadgeActive,
                ]}>
                <Text
                  style={[
                    styles.tabBadgeText,
                    tab === t.key && styles.tabBadgeTextActive,
                  ]}>
                  {t.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          filtered.length === 0 && styles.scrollEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={COLORS.success}
          />
        }>
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>
              {tab === 'upcoming' ? '🗓' : tab === 'completed' ? '✅' : '📅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {tab === 'upcoming'
                ? 'No upcoming appointments'
                : tab === 'completed'
                ? 'No completed appointments'
                : 'No appointments yet'}
            </Text>
            <Text style={styles.emptySub}>
              Tap + Add to schedule one.
            </Text>
          </View>
        ) : (
          filtered.map((appt, index) => (
            <View key={appt.id ?? `${appt.title}-${index}`}>
              <AppointmentCard
                appt={appt}
                onEdit={() =>
                  navigation.navigate('AddEditAppointment', {
                    patientId,
                    appointmentId: appt.id,
                  })
                }
                onComplete={() => handleComplete(appt.id!)}
                onCancel={() => handleCancel(appt)}
                completing={completingId === appt.id}
                completingNotes={completingNotes}
                onNotesChange={setCompletingNotes}
                onConfirmComplete={() => handleConfirmComplete(appt.id!)}
                onCancelComplete={() => setCompletingId(null)}
              />
              {index < filtered.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditAppointment', {patientId})}
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
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},

  headerAddBtn: {marginRight: SPACING.md},
  headerAddText: {color: COLORS.white, fontSize: 15, fontWeight: '600'},

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {borderBottomColor: COLORS.success},
  tabText: {fontSize: 13, fontWeight: '500', color: COLORS.textSecondary},
  tabTextActive: {color: COLORS.success, fontWeight: '700'},
  tabBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeActive: {backgroundColor: COLORS.success + '25'},
  tabBadgeText: {fontSize: 10, fontWeight: '700', color: COLORS.textSecondary},
  tabBadgeTextActive: {color: COLORS.success},

  // Scroll
  scroll: {flex: 1},
  scrollContent: {padding: SPACING.lg, paddingBottom: 90},
  scrollEmpty: {flex: 1, justifyContent: 'center'},

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
  cardCompleted: {opacity: 0.75},

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {fontSize: 11, fontWeight: '700'},
  completedBadge: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: {fontSize: 11, fontWeight: '700', color: COLORS.success},
  overdueBadge: {
    backgroundColor: COLORS.error + '15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  overdueBadgeText: {fontSize: 11, fontWeight: '700', color: COLORS.error},

  cardTitle: {fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 3},
  cardDesc: {fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm},

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  metaText: {fontSize: 12, color: COLORS.textSecondary},

  notesBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  notesLabel: {fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 3},
  notesText: {fontSize: 13, color: COLORS.text, lineHeight: 18},

  // Inline complete form
  completeForm: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  completeFormLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  completeFormInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 13,
    color: COLORS.text,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  completeFormActions: {flexDirection: 'row', gap: SPACING.sm},
  confirmCompleteBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmCompleteBtnText: {color: COLORS.white, fontWeight: '700', fontSize: 13},
  cancelCompleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelCompleteBtnText: {color: COLORS.textSecondary, fontSize: 13},

  // Card actions
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
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
  editBtn: {backgroundColor: COLORS.primary + '15'},
  editBtnText: {fontSize: 12, fontWeight: '600', color: COLORS.primary},
  completeBtn: {backgroundColor: COLORS.success + '15'},
  completeBtnText: {fontSize: 12, fontWeight: '600', color: COLORS.success},
  cancelApptBtn: {backgroundColor: COLORS.error + '12'},
  cancelApptBtnText: {fontSize: 12, fontWeight: '600', color: COLORS.error},

  separator: {height: SPACING.sm},

  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  emptyTitle: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  emptySub: {fontSize: 13, color: COLORS.textSecondary},

  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {fontSize: 28, color: COLORS.white, lineHeight: 32},
});
