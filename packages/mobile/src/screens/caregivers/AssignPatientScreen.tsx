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
import {usePatients} from '../../hooks/usePatients';
import {Patient} from '../../types/patient';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AssignPatient'>;
  route: RouteProp<RootStackParamList, 'AssignPatient'>;
};

export default function AssignPatientScreen({navigation, route}: Props) {
  const {caregiverId} = route.params;
  const {data: allPatients, isLoading: loadingPatients} = usePatients();
  const {data: allCaregivers, isLoading: loadingCaregivers} = useCaregivers();
  const {mutate: assignPatient, isPending} = useAssignPatient();
  const [search, setSearch] = useState('');

  // Compute pool of unassigned patients
  const unassigned = useMemo(() => {
    if (!allPatients || !allCaregivers) {return [];}
    const assignedIds = new Set(
      allCaregivers.flatMap(c => c.assigned_patients.map(p => p.id)),
    );
    const q = search.trim().toLowerCase();
    return allPatients
      .filter(p => !p.id || !assignedIds.has(p.id))
      .filter(
        p =>
          !q ||
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q),
      );
  }, [allPatients, allCaregivers, search]);

  function handleAssign(patient: Patient) {
    Alert.alert(
      'Assign Patient',
      `Assign ${patient.first_name} ${patient.last_name} to this caregiver?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Assign',
          onPress: () =>
            assignPatient(
              {caregiverId, body: {patient_id: patient.id!}},
              {onSuccess: () => navigation.goBack()},
            ),
        },
      ],
    );
  }

  if (loadingPatients || loadingCaregivers) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
            placeholder="Search patients…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        style={styles.flatList}
        data={unassigned ?? []}
        keyExtractor={item => item.id!}
        contentContainerStyle={
          (unassigned ?? []).length === 0 ? styles.listEmpty : styles.listContent
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
                <Text style={styles.rowSub}>{item.phone}</Text>
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
                ? 'No patients match your search.'
                : 'All patients are already assigned.'}
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowAvatarText: {fontSize: 15, fontWeight: '700', color: COLORS.primary},
  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  rowSub: {fontSize: 12, color: COLORS.textSecondary},
  rowAction: {fontSize: 13, color: COLORS.primary, fontWeight: '600'},
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
