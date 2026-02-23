import React, {useEffect, useLayoutEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useQueryClient} from '@tanstack/react-query';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useCreateAppointment} from '../../hooks/useAppointments';
import {Appointment} from '../../types/appointment';
import apiClient from '../../services/api/client';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AddEditAppointment'>;
  route: RouteProp<RootStackParamList, 'AddEditAppointment'>;
};

interface FormState {
  title: string;
  description: string;
  appointment_type: string;
  date: string;
  time: string;
  duration_minutes: string;
  location: string;
  notes: string;
}

const BLANK: FormState = {
  title: '',
  description: '',
  appointment_type: '',
  date: '',
  time: '',
  duration_minutes: '30',
  location: '',
  notes: '',
};

const APPT_TYPES = [
  'General',
  'Specialist',
  'Dental',
  'Therapy',
  'Follow-up',
  'Emergency',
  'Other',
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

// ── Field component ───────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}
        {required && <Text style={fieldStyles.req}> *</Text>}
      </Text>
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.inputMulti,
          !!error && fieldStyles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize="sentences"
      />
      {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {marginBottom: SPACING.md},
  label: {fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  req: {color: COLORS.error},
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputMulti: {height: 75, paddingTop: 10},
  inputError: {borderColor: COLORS.error},
  errorText: {fontSize: 12, color: COLORS.error, marginTop: 4},
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateParts(iso: string): {date: string; time: string} {
  try {
    const d = new Date(iso);
    const date = d.toISOString().split('T')[0];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return {date, time: `${hh}:${mm}`};
  } catch {
    return {date: '', time: ''};
  }
}

function buildIso(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}:00`).toISOString();
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddEditAppointmentScreen({navigation, route}: Props) {
  const {patientId, appointmentId} = route.params;
  const isEdit = !!appointmentId;

  const queryClient = useQueryClient();
  const {mutate: create, isPending: isCreating} = useCreateAppointment();

  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Appointment' : 'New Appointment',
    });
  }, [navigation, isEdit]);

  // Prefill from query cache when editing
  useEffect(() => {
    if (!isEdit || prefilled) {return;}
    // Search all cached appointment queries for this patient
    const allQueries = queryClient.getQueriesData<Appointment[]>({
      queryKey: ['appointments', patientId],
    });
    let found: Appointment | undefined;
    for (const [, data] of allQueries) {
      found = data?.find(a => a.id === appointmentId);
      if (found) {break;}
    }
    if (found) {
      const {date, time} = toDateParts(found.scheduled_at);
      setForm({
        title: found.title,
        description: found.description ?? '',
        appointment_type: found.appointment_type,
        date,
        time,
        duration_minutes: String(found.duration_minutes),
        location: found.location ?? '',
        notes: found.notes ?? '',
      });
      setPrefilled(true);
    }
  }, [isEdit, appointmentId, patientId, prefilled, queryClient]);

  const setField = (key: keyof FormState) => (value: string) => {
    setForm(prev => ({...prev, [key]: value}));
    if (errors[key]) {
      setErrors(prev => ({...prev, [key]: undefined}));
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) {e.title = 'Title is required';}
    if (!form.appointment_type.trim()) {
      e.appointment_type = 'Please select a type';
    }
    if (!form.date.trim()) {
      e.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) {
      e.date = 'Use format YYYY-MM-DD';
    }
    if (!form.time.trim()) {
      e.time = 'Time is required';
    } else if (!/^\d{2}:\d{2}$/.test(form.time.trim())) {
      e.time = 'Use format HH:MM (24h)';
    }
    const dur = parseInt(form.duration_minutes, 10);
    if (!form.duration_minutes || isNaN(dur) || dur < 1) {
      e.duration_minutes = 'Enter a valid duration';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {return;}

    const payload: Omit<Appointment, 'id'> = {
      patient_id: patientId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      appointment_type: form.appointment_type.toLowerCase(),
      scheduled_at: buildIso(form.date.trim(), form.time.trim()),
      duration_minutes: parseInt(form.duration_minutes, 10),
      location: form.location.trim() || undefined,
      completed: false,
      notes: form.notes.trim() || undefined,
    };

    if (isEdit && appointmentId) {
      setIsUpdating(true);
      apiClient
        .patch<Appointment>(`/appointments/${appointmentId}`, payload)
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ['appointments', patientId],
          });
          navigation.goBack();
        })
        .catch(() => Alert.alert('Error', 'Failed to update appointment.'))
        .finally(() => setIsUpdating(false));
    } else {
      create(payload, {
        onSuccess: () => navigation.goBack(),
        onError: () =>
          Alert.alert('Error', 'Failed to schedule appointment.'),
      });
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Core details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <Field
            label="Title"
            required
            value={form.title}
            onChangeText={setField('title')}
            placeholder="e.g. Monthly check-up"
            error={errors.title}
          />
          <Field
            label="Description"
            value={form.description}
            onChangeText={setField('description')}
            placeholder="Optional details…"
            multiline
          />

          {/* Type chips */}
          <View style={fieldStyles.wrap}>
            <Text style={fieldStyles.label}>
              Type <Text style={fieldStyles.req}>*</Text>
            </Text>
            <View style={styles.chips}>
              {APPT_TYPES.map(t => {
                const val = t.toLowerCase();
                const active = form.appointment_type === val;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setField('appointment_type')(val)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.appointment_type ? (
              <Text style={fieldStyles.errorText}>{errors.appointment_type}</Text>
            ) : null}
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Field
                label="Date"
                required
                value={form.date}
                onChangeText={setField('date')}
                placeholder={todayString()}
                error={errors.date}
              />
            </View>
            <View style={styles.halfField}>
              <Field
                label="Time (24h)"
                required
                value={form.time}
                onChangeText={setField('time')}
                placeholder="09:00"
                error={errors.time}
              />
            </View>
          </View>

          {/* Duration presets */}
          <View style={fieldStyles.wrap}>
            <Text style={fieldStyles.label}>
              Duration (minutes) <Text style={fieldStyles.req}>*</Text>
            </Text>
            <View style={styles.chips}>
              {DURATION_PRESETS.map(d => {
                const active = form.duration_minutes === String(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setField('duration_minutes')(String(d))}>
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={[
                fieldStyles.input,
                {marginTop: SPACING.sm},
                !!errors.duration_minutes && fieldStyles.inputError,
              ]}
              value={form.duration_minutes}
              onChangeText={setField('duration_minutes')}
              placeholder="Custom (e.g. 45)"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
            />
            {errors.duration_minutes ? (
              <Text style={fieldStyles.errorText}>{errors.duration_minutes}</Text>
            ) : null}
          </View>

          <Field
            label="Location"
            value={form.location}
            onChangeText={setField('location')}
            placeholder="e.g. City Hospital, Room 204"
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Field
            label="Additional Notes"
            value={form.notes}
            onChangeText={setField('notes')}
            placeholder="Any special instructions or reminders…"
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
          activeOpacity={0.85}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEdit ? 'Save Changes' : 'Schedule Appointment'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SPACING.lg, paddingBottom: SPACING.xl + 16},

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.md,
  },

  rowFields: {flexDirection: 'row', gap: SPACING.sm},
  halfField: {flex: 1},

  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: 4},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipActive: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success,
  },
  chipText: {fontSize: 12, color: COLORS.textSecondary},
  chipTextActive: {color: COLORS.success, fontWeight: '600'},

  submitBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {opacity: 0.6},
  submitBtnText: {fontSize: 16, fontWeight: '700', color: COLORS.white},
});
