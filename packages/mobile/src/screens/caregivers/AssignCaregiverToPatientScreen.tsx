import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useCaregivers, useAssignPatient} from '../../hooks/useCaregivers';
import {useEmployedCaregivers} from '../../hooks/useFounders';
import {useAuth} from '../../context/AuthContext';
import {CaregiverEmploymentSummary} from '../../types/founder';

type Props = {
  navigation: StackNavigationProp<
    RootStackParamList,
    'AssignCaregiverToPatient'
  >;
  route: RouteProp<RootStackParamList, 'AssignCaregiverToPatient'>;
};

export default function AssignCaregiverToPatientScreen({
  navigation,
  route,
}: Props) {
  const {patientId} = route.params;
  const {user} = useAuth();
  const founderId = user?.id ?? '';

  const {data: employed, isLoading: loadingEmployed} =
    useEmployedCaregivers(founderId);
  const {data: allCaregivers, isLoading: loadingAll} = useCaregivers();
  const {mutate: assignPatient, isPending} = useAssignPatient();
  const [search, setSearch] = useState('');

  // Employed caregivers who don't already have this patient assigned
  const available = useMemo(() => {
    if (!employed || !allCaregivers) {return [];}
    // Build set of caregiver IDs already assigned to this patient
    const alreadyAssigned = new Set(
      allCaregivers
        .filter(c => c.assigned_patients.some(p => p.id === patientId))
        .map(c => c.id),
    );
    const q = search.trim().toLowerCase();
    return employed
      .filter(e => !alreadyAssigned.has(e.id))
      .filter(
        e =>
          !q ||
          e.first_name.toLowerCase().includes(q) ||
          e.last_name.toLowerCase().includes(q),
      );
  }, [employed, allCaregivers, patientId, search]);

  function handleAssign(caregiver: CaregiverEmploymentSummary) {
    Alert.alert(
      'Assign Caregiver',
      `Assign ${caregiver.first_name} ${caregiver.last_name} to this patient?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Assign',
          onPress: () =>
            assignPatient(
              {caregiverId: caregiver.id, body: {patient_id: patientId}},
              {onSuccess: () => navigation.goBack()},
            ),
        },
      ],
    );
  }

  if (loadingEmployed || loadingAll) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search caregivers…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        style={styles.flatList}
        data={available ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={
          (available ?? []).length === 0 ? styles.listEmpty : styles.listContent
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({item}) => {
          const initials =
            `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleAssign(item)}
              disabled={isPending}
              activeOpacity={0.75}>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{initials}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.rowSub}>{item.email}</Text>
              </View>
              <Text style={styles.rowAction}>Assign →</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>✅</Text>
            <Text style={styles.emptyTitle}>
              {search
                ? 'No caregivers match your search.'
                : 'All employed caregivers are already assigned to this patient.'}
            </Text>
          </View>
        )}
      />
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
  },
  searchWrap: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {fontSize: 14, marginRight: 4},
  searchInput: {flex: 1, height: 40, fontSize: 14, color: COLORS.text},
  flatList: {flex: 1},
  listContent: {padding: SPACING.lg},
  listEmpty: {flexGrow: 1, justifyContent: 'center', padding: SPACING.lg},
  separator: {height: SPACING.sm},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowAvatarText: {fontSize: 15, fontWeight: '700', color: COLORS.secondary},
  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  rowSub: {fontSize: 12, color: COLORS.textSecondary},
  rowAction: {fontSize: 13, color: COLORS.secondary, fontWeight: '600'},
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg},
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
