import React, {useLayoutEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {
  useCaregivers,
  useUnassignPatient,
} from '../../hooks/useCaregivers';
import {CaregiverProfile} from '../../types/caregiver';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CaregiverDetail'>;
  route: RouteProp<RootStackParamList, 'CaregiverDetail'>;
};

export default function CaregiverDetailScreen({navigation, route}: Props) {
  const {caregiverId} = route.params;
  const {data: allCaregivers, isLoading, isError, refetch, isFetching} =
    useCaregivers();
  const {mutate: unassign, isPending: isUnassigning} = useUnassignPatient();

  const caregiver: CaregiverProfile | undefined = allCaregivers?.find(
    c => c.id === caregiverId,
  );

  useLayoutEffect(() => {
    if (!caregiver) {return;}
    navigation.setOptions({
      title: `${caregiver.first_name} ${caregiver.last_name}`,
    });
  }, [navigation, caregiver]);

  function handleUnassign(patientId: string, patientName: string) {
    Alert.alert(
      'Remove Patient',
      `Remove ${patientName} from this caregiver?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => unassign({caregiverId, patientId}),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  if (isError || !caregiver) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorText}>Could not load caregiver.</Text>
      </View>
    );
  }

  const initials =
    `${caregiver.first_name[0]}${caregiver.last_name[0]}`.toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {caregiver.first_name} {caregiver.last_name}
        </Text>
        {caregiver.email ? (
          <Text style={styles.jobTitle}>{caregiver.email}</Text>
        ) : null}
      </View>

      {/* Contact info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{caregiver.email}</Text>
        </View>
        {caregiver.phone ? (
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{caregiver.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* Assigned patients */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Assigned Patients ({caregiver.assigned_patients.length})
          </Text>
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={() =>
              navigation.navigate('AssignPatient', {caregiverId})
            }>
            <Text style={styles.assignBtnText}>+ Assign</Text>
          </TouchableOpacity>
        </View>

        {caregiver.assigned_patients.length === 0 ? (
          <Text style={styles.noPatients}>No patients assigned yet.</Text>
        ) : (
          caregiver.assigned_patients.map((patient, idx) => (
            <View
              key={patient.id}
              style={[
                styles.patientRow,
                idx < caregiver.assigned_patients.length - 1 &&
                  styles.patientRowBorder,
              ]}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>
                  {patient.first_name} {patient.last_name}
                </Text>
                <Text style={styles.patientSub}>{patient.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  handleUnassign(
                    patient.id,
                    `${patient.first_name} ${patient.last_name}`,
                  )
                }
                disabled={isUnassigning}
                style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
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
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {paddingBottom: SPACING.xl},

  header: {
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  avatar: {
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
  avatarText: {fontSize: 28, fontWeight: '700', color: COLORS.white},
  name: {fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 4},
  jobTitle: {fontSize: 14, color: 'rgba(255,255,255,0.8)'},

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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
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
  assignBtn: {
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assignBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLast: {borderBottomWidth: 0},
  infoLabel: {fontSize: 14, color: COLORS.textSecondary},
  infoValue: {fontSize: 14, color: COLORS.text, fontWeight: '500'},

  noPatients: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingVertical: SPACING.md,
    textAlign: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  patientRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  patientInfo: {flex: 1},
  patientName: {fontSize: 15, fontWeight: '600', color: COLORS.text},
  patientSub: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  removeBtn: {
    padding: SPACING.sm,
  },
  removeBtnText: {fontSize: 16, color: COLORS.error, fontWeight: '700'},
});
