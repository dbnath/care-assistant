import React, {useLayoutEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {usePatient, useDeletePatient} from '../../hooks/usePatients';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'PatientDetail'>;
  route: RouteProp<RootStackParamList, 'PatientDetail'>;
};

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function PatientDetailScreen({navigation, route}: Props) {
  const {patientId} = route.params;
  const {data: patient, isLoading, isError} = usePatient(patientId);
  const {mutate: deletePatient, isPending: isDeleting} = useDeletePatient();

  useLayoutEffect(() => {
    if (!patient) {
      return;
    }
    navigation.setOptions({
      title: `${patient.first_name} ${patient.last_name}`,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerEditBtn}
          onPress={() =>
            navigation.navigate('AddEditPatient', {patientId})
          }>
          <Text style={styles.headerEditText}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, patient, patientId]);

  const handleDelete = () => {
    if (!patient) {
      return;
    }
    Alert.alert(
      'Delete Patient',
      `Delete ${patient.first_name} ${patient.last_name}? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deletePatient(patientId, {
              onSuccess: () => navigation.goBack(),
            }),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !patient) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorText}>Could not load patient.</Text>
      </View>
    );
  }

  const age = patient.date_of_birth ? getAge(patient.date_of_birth) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarText}>
            {patient.first_name[0].toUpperCase()}
            {patient.last_name[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.fullName}>
          {patient.first_name} {patient.last_name}
        </Text>
        {age !== null && (
          <Text style={styles.ageText}>{age} years old</Text>
        )}
        {patient.created_at && (
          <Text style={styles.sinceText}>
            Patient since{' '}
            {new Date(patient.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        )}
      </View>

      {/* Personal info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        {patient.date_of_birth && (
          <InfoRow label="Date of Birth" value={patient.date_of_birth} />
        )}
        <InfoRow label="Phone" value={patient.phone} />
        {patient.email && <InfoRow label="Email" value={patient.email} />}
        {patient.address && (
          <InfoRow label="Address" value={patient.address} last />
        )}
        {!patient.address && !patient.email && (
          <InfoRow label="Phone" value={patient.phone} last />
        )}
      </View>

      {/* Emergency contacts */}
      {patient.emergency_contacts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency Contacts</Text>
          {patient.emergency_contacts.map((contact, idx) => (
            <View
              key={idx}
              style={[
                styles.contactRow,
                idx < patient.emergency_contacts.length - 1 &&
                  styles.contactRowBorder,
              ]}>
              <View style={styles.contactNameRow}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contactDetail}>📞 {contact.phone}</Text>
              <Text style={styles.contactRelation}>
                {contact.relation.charAt(0).toUpperCase() +
                  contact.relation.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Medical notes */}
      {patient.medical_notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medical Notes</Text>
          <Text style={styles.notesText}>{patient.medical_notes}</Text>
        </View>
      ) : null}

      {/* Delete */}
      <TouchableOpacity
        style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
        onPress={handleDelete}
        disabled={isDeleting}
        activeOpacity={0.8}>
        <Text style={styles.deleteBtnText}>
          {isDeleting ? 'Deleting…' : '🗑  Delete Patient'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  errorText: {fontSize: 15, color: COLORS.error},

  headerEditBtn: {marginRight: SPACING.md},
  headerEditText: {color: COLORS.white, fontSize: 15, fontWeight: '600'},

  container: {flex: 1, backgroundColor: COLORS.background},
  content: {paddingBottom: SPACING.xl},

  // Profile header
  profileHeader: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  bigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bigAvatarText: {fontSize: 28, fontWeight: '700', color: COLORS.white},
  fullName: {fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 4},
  ageText: {fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 2},
  sinceText: {fontSize: 12, color: 'rgba(255,255,255,0.6)'},

  // Card
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
  },
  infoRowBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.border},
  infoLabel: {fontSize: 14, color: COLORS.textSecondary, flex: 1},
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },

  // Emergency contacts
  contactRow: {paddingVertical: 12},
  contactRowBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.border},
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginRight: SPACING.sm},
  primaryBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: {fontSize: 11, color: COLORS.primary, fontWeight: '600'},
  contactDetail: {fontSize: 13, color: COLORS.textSecondary, marginBottom: 2},
  contactRelation: {fontSize: 12, color: COLORS.textSecondary},

  // Medical notes
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    paddingVertical: SPACING.md,
  },

  // Delete button
  deleteBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnDisabled: {opacity: 0.5},
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});
