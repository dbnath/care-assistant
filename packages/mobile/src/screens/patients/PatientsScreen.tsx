import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useRoleAwarePatients} from '../../hooks/useRoleAwarePatients';
import {useAuth} from '../../context/AuthContext';
import {Patient} from '../../types/patient';

type NavProp = StackNavigationProp<RootStackParamList, 'Patients'>;

function getAge(dob: string): string {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} yrs`;
}

function PatientCard({
  patient,
  onPress,
}: {
  patient: Patient;
  onPress: () => void;
}) {
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const primaryContact = patient.emergency_contacts ? patient.emergency_contacts.find(c => c.is_primary) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>{initials}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>
          {patient.first_name} {patient.last_name}
        </Text>
        <View style={styles.cardMeta}>
          {patient.date_of_birth ? (
            <Text style={styles.cardMetaText}>
              🎂 {getAge(patient.date_of_birth)}
            </Text>
          ) : null}
          <Text style={styles.cardMetaText}>📞 {patient.phone}</Text>
        </View>
        {primaryContact ? (
          <Text style={styles.cardContact}>
            Emergency: {primaryContact.name} ({primaryContact.relation})
          </Text>
        ) : null}
      </View>
      <Text style={styles.cardChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function PatientsScreen() {
  const navigation = useNavigation<NavProp>();
  const {user} = useAuth();
  const {data: patients, isLoading, isError, refetch, isFetching} = useRoleAwarePatients();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!patients) {
      return [];
    }
    const q = search.trim().toLowerCase();
    if (!q) {
      return patients;
    }
    return patients.filter(
      p =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.email ?? '').toLowerCase().includes(q),
    );
  }, [patients, search]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone or email…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }>
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No results found' : 'No patients yet'}
            </Text>
            <Text style={styles.emptySub}>
              {search
                ? 'Try a different search term.'
                : 'Tap + to add your first patient.'}
            </Text>
          </View>
        ) : (
          filtered.map((item, index) => (
            <View key={item.id ?? `${item.first_name}-${item.last_name}`}>
              <PatientCard
                patient={item}
                onPress={() =>
                  navigation.navigate('PatientDetail', {patientId: item.id!})
                }
              />
              {index < filtered.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB — founders only */}
      {user?.role === 'founder' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddEditPatient', {})}
          activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  bigIcon: {fontSize: 52, marginBottom: SPACING.md},
  loadingText: {marginTop: SPACING.sm, color: COLORS.textSecondary, fontSize: 14},
  errorTitle: {fontSize: 16, fontWeight: '600', color: COLORS.error, marginBottom: 4},
  errorSub: {fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg},
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},

  // Search
  searchWrap: {
    backgroundColor: COLORS.primary,
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
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: COLORS.text,
  },

  // List
  list: {flex: 1, backgroundColor: COLORS.background},
  listContent: {padding: SPACING.lg, paddingBottom: 80},
  listContentEmpty: {flex: 1, justifyContent: 'center'},

  // Card
  card: {
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
  cardAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardAvatarText: {fontSize: 16, fontWeight: '700', color: COLORS.primary},
  cardBody: {flex: 1},
  cardName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  cardMeta: {flexDirection: 'row', gap: SPACING.md, marginBottom: 3},
  cardMetaText: {fontSize: 12, color: COLORS.textSecondary},
  cardContact: {fontSize: 12, color: COLORS.textSecondary},
  cardChevron: {fontSize: 22, color: COLORS.border, marginLeft: SPACING.xs},

  separator: {height: SPACING.sm},

  // Empty
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  emptyTitle: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  emptySub: {fontSize: 13, color: COLORS.textSecondary},

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {fontSize: 28, color: COLORS.white, lineHeight: 32},
});
