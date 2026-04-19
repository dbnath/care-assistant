import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/types';
import {COLORS, SPACING} from '../config/constants';
import {useAuth} from '../context/AuthContext';
import {useHomeStats} from '../hooks/useHomeStats';
import {UserRole} from '../types/auth';

type HomeNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type TopLevelScreen =
  | 'Patients'
  | 'Caregivers'
  | 'Medications'
  | 'Appointments'
  | 'Uploads';

interface NavCard {
  title: string;
  description: string;
  icon: string;
  color: string;
  screen: TopLevelScreen;
  roles: UserRole[];
}

const NAV_CARDS: NavCard[] = [
  {
    title: 'Patients',
    description: 'View & manage patient profiles',
    icon: '👥',
    color: COLORS.primary,
    screen: 'Patients',
    roles: ['founder', 'caregiver'],
  },
  {
    title: 'Caregivers',
    description: 'Employ & manage your care team',
    icon: '🧑‍⚕️',
    color: COLORS.secondary,
    screen: 'Caregivers',
    roles: ['founder'],
  },
  {
    title: 'Medications',
    description: 'Track & manage prescriptions',
    icon: '💊',
    color: COLORS.secondary,
    screen: 'Medications',
    roles: ['founder', 'caregiver', 'patient'],
  },
  {
    title: 'Appointments',
    description: 'Schedule & track visits',
    icon: '📅',
    color: COLORS.success,
    screen: 'Appointments',
    roles: ['founder', 'caregiver', 'patient'],
  },
  {
    title: 'Uploads',
    description: 'Prescriptions & reports',
    icon: '📁',
    color: COLORS.warning,
    screen: 'Uploads',
    roles: ['founder', 'caregiver', 'patient'],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'Founder',
  caregiver: 'Care Giver',
  patient: 'Patient',
};

const ROLE_COLORS: Record<UserRole, string> = {
  founder: COLORS.secondary,
  caregiver: COLORS.primary,
  patient: COLORS.success,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {return 'Good Morning';}
  if (hour < 17) {return 'Good Afternoon';}
  return 'Good Evening';
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const {user, signOut} = useAuth();
  const stats = useHomeStats();

  const visibleCards = NAV_CARDS.filter(
    c => !user || c.roles.includes(user.role),
  );

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: signOut},
    ]);
  }

  /**
   * For the patient role, Medications/Appointments/Uploads skip the
   * patient-picker and navigate directly to the patient's own data.
   */
  function handleCardPress(screen: TopLevelScreen) {
    if (user?.role === 'patient' && user.patient_id) {
      const patientName = `${user.first_name} ${user.last_name}`;
      if (screen === 'Medications') {
        navigation.navigate('MedicationList', {
          patientId: user.patient_id,
          patientName,
        });
        return;
      }
      if (screen === 'Appointments') {
        navigation.navigate('AppointmentList', {
          patientId: user.patient_id,
          patientName,
        });
        return;
      }
      if (screen === 'Uploads') {
        navigation.navigate('UploadList', {
          patientId: user.patient_id,
          patientName,
        });
        return;
      }
    }
    navigation.navigate(screen);
  }

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
              <Text style={styles.userName}>
                {user ? `${user.first_name} ${user.last_name}` : '—'}
              </Text>
              {user && (
                <View
                  style={[
                    styles.roleBadge,
                    {backgroundColor: ROLE_COLORS[user.role] + '30'},
                  ]}>
                  <Text
                    style={[
                      styles.roleBadgeText,
                      {color: ROLE_COLORS[user.role]},
                    ]}>
                    {ROLE_LABELS[user.role]}
                  </Text>
                </View>
              )}
              {user?.email && (
                <Text style={styles.userEmail}>{user.email}</Text>
              )}
            </View>
            <View style={styles.rightCol}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user
                    ? getInitials(user.first_name, user.last_name)
                    : '?'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats — hidden when empty */}
        {stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((stat, idx) => (
              <View
                key={stat.label}
                style={[
                  styles.statCard,
                  idx > 0 && idx < stats.length && styles.statCardBorder,
                ]}>
                <Text style={styles.statValue}>
                  {stat.value === null ? '—' : stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Navigation Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.cardsGrid}>
            {visibleCards.map(card => (
              <TouchableOpacity
                key={card.screen}
                style={styles.card}
                onPress={() => handleCardPress(card.screen)}
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
                  style={[
                    styles.cardFooter,
                    {borderTopColor: card.color + '30'},
                  ]}>
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
  safeArea: {flex: 1, backgroundColor: COLORS.primary},
  container: {flex: 1, backgroundColor: COLORS.background},
  scrollContent: {paddingBottom: SPACING.xl},

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
  greetingBlock: {flex: 1},
  greeting: {fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 2},
  userName: {fontSize: 24, fontWeight: '700', color: COLORS.white, marginBottom: 6},
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  roleBadgeText: {fontSize: 12, fontWeight: '700'},
  userEmail: {fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2},
  rightCol: {alignItems: 'center', gap: SPACING.xs},
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
  avatarText: {fontSize: 18, fontWeight: '700', color: COLORS.white},
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signOutText: {fontSize: 11, color: COLORS.white, fontWeight: '600'},

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
  statCard: {flex: 1, alignItems: 'center', paddingVertical: SPACING.md},
  statCardBorder: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  statValue: {fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 2},
  statLabel: {fontSize: 11, color: COLORS.textSecondary, textAlign: 'center'},

  section: {marginTop: SPACING.lg, paddingHorizontal: SPACING.lg},
  sectionTitle: {fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md},

  cardsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
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
  cardIcon: {fontSize: 22},
  cardTitle: {fontSize: 15, fontWeight: '700', marginBottom: 4},
  cardDescription: {fontSize: 12, color: COLORS.textSecondary, lineHeight: 16, marginBottom: SPACING.sm},
  cardFooter: {borderTopWidth: 1, paddingTop: SPACING.xs, marginTop: SPACING.xs},
  cardLink: {fontSize: 12, fontWeight: '600'},
});
