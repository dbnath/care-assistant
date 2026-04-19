import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
import {useEmployedCaregivers} from '../../hooks/useFounders';
import {useAuth} from '../../context/AuthContext';
import {CaregiverEmploymentSummary} from '../../types/founder';

type NavProp = StackNavigationProp<RootStackParamList, 'Caregivers'>;

function CaregiverRow({
  caregiver,
  onPress,
}: {
  caregiver: CaregiverEmploymentSummary;
  onPress: () => void;
}) {
  const initials =
    `${caregiver.first_name[0]}${caregiver.last_name[0]}`.toUpperCase();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>{initials}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>
          {caregiver.first_name} {caregiver.last_name}
        </Text>
        <Text style={styles.rowSub}>
          {caregiver.job_title ?? 'Caregiver'} · {caregiver.email}
        </Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function CaregiversScreen() {
  const navigation = useNavigation<NavProp>();
  const {user} = useAuth();
  const founderId = user?.id ?? '';

  const {
    data: caregivers,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useEmployedCaregivers(founderId);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!caregivers) {return [];}
    const q = search.trim().toLowerCase();
    if (!q) {return caregivers;}
    return caregivers.filter(
      c =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        (c.job_title ?? '').toLowerCase().includes(q),
    );
  }, [caregivers, search]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load caregivers.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* Search bar */}
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

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={!!isFetching} onRefresh={refetch} />
        }
        contentContainerStyle={
          filtered.length === 0 ? styles.listEmpty : styles.listContent
        }
        showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>👤</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No caregivers match your search.' : 'No caregivers employed yet.'}
            </Text>
            {!search && (
              <Text style={styles.emptySub}>
                Tap the button below to employ your first caregiver.
              </Text>
            )}
          </View>
        ) : (
          filtered.map((item, idx) => (
            <React.Fragment key={item.id}>
              <CaregiverRow
                caregiver={item}
                onPress={() =>
                  navigation.navigate('CaregiverDetail', {caregiverId: item.id})
                }
              />
              {idx < filtered.length - 1 && (
                <View style={styles.separator} />
              )}
            </React.Fragment>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EmployCaregiver')}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  bigIcon: {fontSize: 48, marginBottom: SPACING.md, textAlign: 'center'},
  errorTitle: {fontSize: 15, color: COLORS.error, marginBottom: SPACING.lg},
  retryBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},

  searchWrap: {
    backgroundColor: COLORS.secondary,
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

  list: {flex: 1},
  listContent: {padding: SPACING.lg, paddingBottom: 80},
  listEmpty: {flexGrow: 1, justifyContent: 'center', padding: SPACING.lg, paddingBottom: 80},
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
  rowChevron: {fontSize: 22, color: COLORS.border, marginLeft: SPACING.xs},

  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {fontSize: 13, color: COLORS.textSecondary, textAlign: 'center'},

  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {fontSize: 28, color: COLORS.white, lineHeight: 32},
});
