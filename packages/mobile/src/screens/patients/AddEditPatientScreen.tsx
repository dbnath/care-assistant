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
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {
  usePatient,
  useCreatePatient,
  useUpdatePatient,
} from '../../hooks/usePatients';
import {EmergencyContact, EmergencyContactRelation} from '../../types/patient';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AddEditPatient'>;
  route: RouteProp<RootStackParamList, 'AddEditPatient'>;
};

interface FormState {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  address: string;
  medical_notes: string;
}

interface ContactDraft extends EmergencyContact {}

const BLANK_CONTACT: ContactDraft = {
  name: '',
  phone: '',
  relation: EmergencyContactRelation.OTHER,
  is_primary: false,
};

const RELATION_LABELS: Record<EmergencyContactRelation, string> = {
  [EmergencyContactRelation.SPOUSE]: 'Spouse',
  [EmergencyContactRelation.CHILD]: 'Child',
  [EmergencyContactRelation.SIBLING]: 'Sibling',
  [EmergencyContactRelation.FRIEND]: 'Friend',
  [EmergencyContactRelation.CAREGIVER]: 'Caregiver',
  [EmergencyContactRelation.OTHER]: 'Other',
};

const BLANK_FORM: FormState = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  phone: '',
  email: '',
  address: '',
  medical_notes: '',
};

// ── Small reusable field ──────────────────────────────────────────────────────
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
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}
        {required && <Text style={fieldStyles.required}> *</Text>}
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
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {marginBottom: SPACING.md},
  label: {fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  required: {color: COLORS.error},
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
  inputMulti: {height: 90, paddingTop: 10},
  inputError: {borderColor: COLORS.error},
  errorText: {fontSize: 12, color: COLORS.error, marginTop: 4},
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddEditPatientScreen({navigation, route}: Props) {
  const patientId = route.params?.patientId;
  const isEdit = !!patientId;

  const {data: existing, isLoading: loadingExisting} = usePatient(
    patientId ?? '',
  );
  const {mutate: createPatient, isPending: isCreating} = useCreatePatient();
  const {mutate: updatePatient, isPending: isUpdating} = useUpdatePatient();

  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [contacts, setContacts] = useState<ContactDraft[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [prefilled, setPrefilled] = useState(false);

  // Set header title dynamically
  useLayoutEffect(() => {
    navigation.setOptions({title: isEdit ? 'Edit Patient' : 'Add Patient'});
  }, [navigation, isEdit]);

  // Prefill form when editing
  useEffect(() => {
    if (isEdit && existing && !prefilled) {
      setForm({
        first_name: existing.first_name,
        last_name: existing.last_name,
        date_of_birth: existing.date_of_birth,
        phone: existing.phone,
        email: existing.email ?? '',
        address: existing.address ?? '',
        medical_notes: existing.medical_notes ?? '',
      });
      setContacts(existing.emergency_contacts.map(c => ({...c})));
      setPrefilled(true);
    }
  }, [existing, isEdit, prefilled]);

  const setField = (key: keyof FormState) => (value: string) => {
    setForm(prev => ({...prev, [key]: value}));
    if (errors[key]) {
      setErrors(prev => ({...prev, [key]: undefined}));
    }
  };

  // ── Emergency contact helpers ───────────────────────────────────────────────
  const addContact = () => {
    setContacts(prev => [...prev, {...BLANK_CONTACT}]);
  };

  const removeContact = (idx: number) => {
    setContacts(prev => prev.filter((_, i) => i !== idx));
  };

  const updateContact = (
    idx: number,
    key: keyof ContactDraft,
    value: string | boolean | EmergencyContactRelation,
  ) => {
    setContacts(prev =>
      prev.map((c, i) => (i === idx ? {...c, [key]: value} : c)),
    );
  };

  const setPrimary = (idx: number) => {
    setContacts(prev =>
      prev.map((c, i) => ({...c, is_primary: i === idx})),
    );
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!form.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!form.date_of_birth.trim()) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth.trim())) {
      newErrors.date_of_birth = 'Use format YYYY-MM-DD';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      medical_notes: form.medical_notes.trim() || undefined,
      emergency_contacts: contacts.filter(c => c.name.trim() && c.phone.trim()),
    };

    if (isEdit && patientId) {
      updatePatient(
        {id: patientId, data: payload},
        {
          onSuccess: () => navigation.goBack(),
          onError: () =>
            Alert.alert('Error', 'Failed to update patient. Please try again.'),
        },
      );
    } else {
      createPatient(payload, {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: () =>
          Alert.alert('Error', 'Failed to create patient. Please try again.'),
      });
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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

        {/* Basic info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Field
            label="First Name"
            required
            value={form.first_name}
            onChangeText={setField('first_name')}
            error={errors.first_name}
          />
          <Field
            label="Last Name"
            required
            value={form.last_name}
            onChangeText={setField('last_name')}
            error={errors.last_name}
          />
          <Field
            label="Date of Birth"
            required
            value={form.date_of_birth}
            onChangeText={setField('date_of_birth')}
            placeholder="YYYY-MM-DD"
            error={errors.date_of_birth}
          />
          <Field
            label="Phone"
            required
            value={form.phone}
            onChangeText={setField('phone')}
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <Field
            label="Email"
            value={form.email}
            onChangeText={setField('email')}
            keyboardType="email-address"
            placeholder="optional"
          />
          <Field
            label="Address"
            value={form.address}
            onChangeText={setField('address')}
            placeholder="optional"
          />
        </View>

        {/* Emergency contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {contacts.length === 0 && (
            <Text style={styles.emptyHint}>No emergency contacts added yet.</Text>
          )}
          {contacts.map((contact, idx) => (
            <View key={idx} style={styles.contactCard}>
              <View style={styles.contactCardHeader}>
                <Text style={styles.contactCardLabel}>Contact {idx + 1}</Text>
                <TouchableOpacity onPress={() => removeContact(idx)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              <Field
                label="Name"
                required
                value={contact.name}
                onChangeText={v => updateContact(idx, 'name', v)}
              />
              <Field
                label="Phone"
                required
                value={contact.phone}
                onChangeText={v => updateContact(idx, 'phone', v)}
                keyboardType="phone-pad"
              />

              {/* Relation chips */}
              <Text style={fieldStyles.label}>Relation</Text>
              <View style={styles.chipsRow}>
                {Object.values(EmergencyContactRelation).map(rel => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.chip,
                      contact.relation === rel && styles.chipActive,
                    ]}
                    onPress={() => updateContact(idx, 'relation', rel)}>
                    <Text
                      style={[
                        styles.chipText,
                        contact.relation === rel && styles.chipTextActive,
                      ]}>
                      {RELATION_LABELS[rel]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Primary toggle */}
              <TouchableOpacity
                style={styles.primaryToggle}
                onPress={() => setPrimary(idx)}>
                <View
                  style={[
                    styles.primaryRadio,
                    contact.is_primary && styles.primaryRadioActive,
                  ]}
                />
                <Text style={styles.primaryToggleText}>Set as primary contact</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addContactBtn} onPress={addContact}>
            <Text style={styles.addContactBtnText}>+ Add Emergency Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Medical notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Notes</Text>
          <Field
            label="Notes"
            value={form.medical_notes}
            onChangeText={setField('medical_notes')}
            placeholder="Allergies, conditions, special instructions…"
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
              {isEdit ? 'Save Changes' : 'Add Patient'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SPACING.lg, paddingBottom: SPACING.xl + 16},

  // Section
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
  emptyHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  // Contact card
  contactCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  contactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contactCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  removeText: {fontSize: 13, color: COLORS.error, fontWeight: '600'},

  // Relation chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  chipText: {fontSize: 12, color: COLORS.textSecondary},
  chipTextActive: {color: COLORS.primary, fontWeight: '600'},

  // Primary toggle
  primaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  primaryRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  primaryRadioActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  primaryToggleText: {fontSize: 13, color: COLORS.text},

  // Add contact button
  addContactBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  addContactBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Submit
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {opacity: 0.6},
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
