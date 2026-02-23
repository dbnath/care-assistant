import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/types';
import {COLORS, SPACING} from '../config/constants';
import {usePatients} from '../hooks/usePatients';

type HomeNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const CAREGIVER = {
  name: 'Sarah Johnson',
  role: 'Senior Caregiver',
  initials: 'SJ',
  facility: 'Sunrise Care Home',
};

interface NavCard {
  title: string;
  description: string;
  icon: string;
  color: string;
  screen: keyof RootStackParamList;
}

const NAV_CARDS: NavCard[] = [
  {
    title: 'Patients',
    description: 'View & manage patient profiles',
    icon: '👥',
    color: COLORS.primary,
    screen: 'Patients',
  },
  {
    title: 'Medications',
    description: 'Track & manage prescriptions',
    icon: '💊',
    color: COLORS.secondary,
    screen: 'Medications',
  },
  {
    title: 'Appointments',
    description: 'Schedule & track visits',
    icon: '📅',
    color: COLORS.success,
    screen: 'Appointments',
  },
  {
    title: 'Uploads',
    description: 'Prescriptions & reports',
    icon: '📁',
    color: COLORS.warning,
    screen: 'Uploads',
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const {data: patients, isLoading: patientsLoading} = usePatients();

  const patientCount = patients?.length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header / Profile */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.caregiverName}>{CAREGIVER.name}</Text>
              <Text style={styles.caregiverRole}>{CAREGIVER.role}</Text>
              <Text style={styles.facility}>{CAREGIVER.facility}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{CAREGIVER.initials}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {patientsLoading ? '—' : patientCount}
            </Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Today's Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        {/* Navigation Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.cardsGrid}>
            {NAV_CARDS.map(card => (
              <TouchableOpacity
                key={card.screen}
                style={styles.card}
                onPress={() => navigation.navigate(card.screen)}
                activeOpacity={0.75}>
                <View
                  style={[
                    styles.cardIconBg,
                    {backgroundColor: card.color + '20'},
                  ]}>
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                </View>
                <Text style={[styles.cardTitle, {color: card.color}]}>
                  {card.title}
                </Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
                <View
                  style={[styles.cardFooter, {borderTopColor: card.color + '30'}]}>
                  <Text style={[styles.cardLink, {color: card.color}]}>
                    Open →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  caregiverName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  caregiverRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  facility: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statCardMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Cards Grid
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  card: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: SPACING.xs,
    marginTop: SPACING.xs,
  },
  cardLink: {
    fontSize: 12,
    fontWeight: '600',
  },
});
