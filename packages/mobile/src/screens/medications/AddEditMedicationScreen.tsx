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
import {useCreateMedication, useUpdateMedication} from '../../hooks/useMedications';
import {Medication} from '../../types/medication';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AddEditMedication'>;
  route: RouteProp<RootStackParamList, 'AddEditMedication'>;
};

interface FormState {
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  instructions: string;
}

const BLANK: FormState = {
  name: '',
  dosage: '',
  frequency: '',
  start_date: '',
  end_date: '',
  instructions: '',
};

const FREQUENCY_PRESETS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Weekly',
];

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
  keyboardType?: 'default' | 'decimal-pad';
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
  inputMulti: {height: 80, paddingTop: 10},
  inputError: {borderColor: COLORS.error},
  errorText: {fontSize: 12, color: COLORS.error, marginTop: 4},
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddEditMedicationScreen({navigation, route}: Props) {
  const {patientId, medicationId} = route.params;
  const isEdit = !!medicationId;

  const queryClient = useQueryClient();
  const {mutate: create, isPending: isCreating} = useCreateMedication();
  const {mutate: update, isPending: isUpdating} = useUpdateMedication();

  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [prefilled, setPrefilled] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({title: isEdit ? 'Edit Medication' : 'Add Medication'});
  }, [navigation, isEdit]);

  // Prefill from query cache when editing
  useEffect(() => {
    if (!isEdit || prefilled) {return;}
    const cached =
      (queryClient.getQueryData<Medication[]>(['medications', patientId, true]) ??
        queryClient.getQueryData<Medication[]>(['medications', patientId, false]))
        ?.find(m => m.id === medicationId);

    if (cached) {
      setForm({
        name: cached.name,
        dosage: cached.dosage,
        frequency: cached.frequency,
        start_date: toDateInput(cached.start_date),
        end_date: cached.end_date ? toDateInput(cached.end_date) : '',
        instructions: cached.instructions ?? '',
      });
      setPrefilled(true);
    }
  }, [isEdit, medicationId, patientId, prefilled, queryClient]);

  const setField = (key: keyof FormState) => (value: string) => {
    setForm(prev => ({...prev, [key]: value}));
    if (errors[key]) {
      setErrors(prev => ({...prev, [key]: undefined}));
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) {e.name = 'Medication name is required';}
    if (!form.dosage.trim()) {e.dosage = 'Dosage is required';}
    if (!form.frequency.trim()) {e.frequency = 'Frequency is required';}
    if (!form.start_date.trim()) {
      e.start_date = 'Start date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.start_date.trim())) {
      e.start_date = 'Use format YYYY-MM-DD';
    }
    if (form.end_date.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.end_date.trim())) {
      e.end_date = 'Use format YYYY-MM-DD';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {return;}

    const payload: Omit<Medication, 'id'> = {
      patient_id: patientId,
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      start_date: form.start_date.trim(),
      end_date: form.end_date.trim() || undefined,
      instructions: form.instructions.trim() || undefined,
      active: true,
    };

    if (isEdit && medicationId) {
      update(
        {id: medicationId, data: payload},
        {
          onSuccess: () => navigation.goBack(),
          onError: () =>
            Alert.alert('Error', 'Failed to update medication. Please try again.'),
        },
      );
    } else {
      create(payload, {
        onSuccess: () => navigation.goBack(),
        onError: () =>
          Alert.alert('Error', 'Failed to add medication. Please try again.'),
      });
    }
  };

  const isSaving = isCreating || isUpdating;
  const today = toDateInput(new Date().toISOString());

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Medication details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Details</Text>
          <Field
            label="Medication Name"
            required
            value={form.name}
            onChangeText={setField('name')}
            placeholder="e.g. Metformin"
            error={errors.name}
          />
          <Field
            label="Dosage"
            required
            value={form.dosage}
            onChangeText={setField('dosage')}
            placeholder="e.g. 500mg"
            error={errors.dosage}
          />

          {/* Frequency with presets */}
          <View style={fieldStyles.wrap}>
            <Text style={fieldStyles.label}>
              Frequency <Text style={fieldStyles.req}>*</Text>
            </Text>
            <TextInput
              style={[fieldStyles.input, !!errors.frequency && fieldStyles.inputError]}
              value={form.frequency}
              onChangeText={setField('frequency')}
              placeholder="e.g. Twice daily"
              placeholderTextColor={COLORS.textSecondary}
            />
            {errors.frequency ? (
              <Text style={fieldStyles.errorText}>{errors.frequency}</Text>
            ) : null}
            <View style={styles.presets}>
              {FREQUENCY_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.preset,
                    form.frequency === preset && styles.presetActive,
                  ]}
                  onPress={() => setField('frequency')(preset)}>
                  <Text
                    style={[
                      styles.presetText,
                      form.frequency === preset && styles.presetTextActive,
                    ]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <Field
            label="Start Date"
            required
            value={form.start_date}
            onChangeText={setField('start_date')}
            placeholder={`e.g. ${today}`}
            error={errors.start_date}
          />
          <Field
            label="End Date"
            value={form.end_date}
            onChangeText={setField('end_date')}
            placeholder="Leave blank if ongoing"
            error={errors.end_date}
          />
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Field
            label="Instructions"
            value={form.instructions}
            onChangeText={setField('instructions')}
            placeholder="e.g. Take with food, avoid alcohol…"
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
              {isEdit ? 'Save Changes' : 'Add Medication'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function toDateInput(iso: string): string {
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return iso;
  }
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

  // Frequency presets
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  preset: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  presetActive: {
    backgroundColor: COLORS.secondary + '15',
    borderColor: COLORS.secondary,
  },
  presetText: {fontSize: 12, color: COLORS.textSecondary},
  presetTextActive: {color: COLORS.secondary, fontWeight: '600'},

  submitBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {opacity: 0.6},
  submitBtnText: {fontSize: 16, fontWeight: '700', color: COLORS.white},
});
