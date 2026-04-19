import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useRoleAwarePatients} from '../../hooks/useRoleAwarePatients';
import {Patient} from '../../types/patient';

type NavProp = StackNavigationProp<RootStackParamList, 'Appointments'>;

function PatientRow({patient, onPress}: {patient: Patient; onPress: () => void}) {
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>{initials}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>
          {patient.first_name} {patient.last_name}
        </Text>
        <Text style={styles.rowSub}>📞 {patient.phone}</Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function AppointmentsScreen() {
  const navigation = useNavigation<NavProp>();
  const {data: patients, isLoading, isError, refetch, isFetching} = useRoleAwarePatients();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!patients) {return [];}
    const q = search.trim().toLowerCase();
    if (!q) {return patients;}
    return patients.filter(
      p =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q),
    );
  }, [patients, search]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.success} />
        <Text style={styles.loadingText}>Loading patients…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load patients</Text>
        <Text style={styles.errorSub}>Make sure the backend is running.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.success} />

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
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
            <Text style={styles.bigIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No matching patients' : 'No patients yet'}
            </Text>
            <Text style={styles.emptySub}>
              Add patients first to manage appointments.
            </Text>
          </View>
        ) : (
          filtered.map((item, index) => (
            <View key={item.id ?? item.phone}>
              <PatientRow
                patient={item}
                onPress={() =>
                  navigation.navigate('AppointmentList', {
                    patientId: item.id!,
                    patientName: `${item.first_name} ${item.last_name}`,
                  })
                }
              />
              {index < filtered.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: COLORS.success},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  loadingText: {marginTop: SPACING.sm, color: COLORS.textSecondary, fontSize: 14},
  errorTitle: {fontSize: 16, fontWeight: '600', color: COLORS.error, marginBottom: 4},
  errorSub: {fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg},
  retryBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},

  searchWrap: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
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

  list: {flex: 1, backgroundColor: COLORS.background},
  listContent: {padding: SPACING.lg},
  listEmpty: {flex: 1, justifyContent: 'center'},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowAvatarText: {fontSize: 15, fontWeight: '700', color: COLORS.success},
  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  rowSub: {fontSize: 12, color: COLORS.textSecondary},
  rowChevron: {fontSize: 22, color: COLORS.border},

  separator: {height: SPACING.sm},
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  emptyTitle: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  emptySub: {fontSize: 13, color: COLORS.textSecondary, textAlign: 'center'},
});
