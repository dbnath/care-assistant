import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useCaregivers} from '../../hooks/useCaregivers';
import {useEmployedCaregivers, useEmployCaregiver} from '../../hooks/useFounders';
import {useAuth} from '../../context/AuthContext';
import {CaregiverProfile} from '../../types/caregiver';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'EmployCaregiver'>;
};

export default function EmployCaregiverScreen({navigation}: Props) {
  const {user} = useAuth();
  const founderId = user?.id ?? '';

  const {data: allCaregivers, isLoading: loadingAll} = useCaregivers();
  const {data: employed, isLoading: loadingEmployed} =
    useEmployedCaregivers(founderId);
  const {mutate: employCaregiver, isPending} = useEmployCaregiver();
  const [search, setSearch] = useState('');

  // Caregivers not yet employed by this founder
  const available = useMemo(() => {
    if (!allCaregivers || !employed) {return [];}
    const employedIds = new Set(employed.map(e => e.id));
    const q = search.trim().toLowerCase();
    return allCaregivers
      .filter(c => !employedIds.has(c.id))
      .filter(
        c =>
          !q ||
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q),
      );
  }, [allCaregivers, employed, search]);

  function handleEmploy(caregiver: CaregiverProfile) {
    Alert.alert(
      'Employ Caregiver',
      `Employ ${caregiver.first_name} ${caregiver.last_name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Employ',
          onPress: () =>
            employCaregiver(
              {founderId, body: {caregiver_id: caregiver.id}},
              {onSuccess: () => navigation.goBack()},
            ),
        },
      ],
    );
  }

  if (loadingAll || loadingEmployed) {
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

      <ScrollView
        style={styles.flatList}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          available.length === 0 ? styles.listEmpty : styles.listContent
        }
        showsVerticalScrollIndicator={false}>
        {available.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>
              {search ? '🔍' : '✅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {search
                ? 'No caregivers match your search.'
                : 'All registered caregivers are already employed.'}
            </Text>
          </View>
        ) : (
          available.map((item, idx) => {
            const initials =
              `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleEmploy(item)}
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
                  <Text style={styles.rowAction}>Employ →</Text>
                </TouchableOpacity>
                {idx < available.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
            );
          })
        )}
      </ScrollView>
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
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
