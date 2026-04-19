import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {AuthStackParamList} from '../../navigation/types';
import {authApi} from '../../services/api/auth';
import {useAuth} from '../../context/AuthContext';
import {UserRole} from '../../types/auth';
import {COLORS, SPACING} from '../../config/constants';

type Props = {navigation: StackNavigationProp<AuthStackParamList, 'Register'>};

interface RoleOption {
  value: UserRole;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const ROLES: RoleOption[] = [
  {
    value: 'founder',
    label: 'Founder',
    icon: '🏥',
    description: 'Hospital, clinic or care facility',
    color: COLORS.secondary,
  },
  {
    value: 'caregiver',
    label: 'Care Giver',
    icon: '👩‍⚕️',
    description: 'Employee managing patients',
    color: COLORS.primary,
  },
  {
    value: 'patient',
    label: 'Patient',
    icon: '🧑‍🦳',
    description: 'Registered patient',
    color: COLORS.success,
  },
];

export default function RegisterScreen({navigation}: Props) {
  const {signIn} = useAuth();

  const [role, setRole] = useState<UserRole>('caregiver');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Patient-only fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!firstName.trim()) {return 'First name is required.';}
    if (!lastName.trim()) {return 'Last name is required.';}
    if (!email.trim()) {return 'Email is required.';}
    if (password.length < 8) {return 'Password must be at least 8 characters.';}
    if (password !== confirmPassword) {return 'Passwords do not match.';}
    if (role === 'patient') {
      if (!dateOfBirth.trim()) {return 'Date of birth is required for patients.';}
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        return 'Date of birth must be in YYYY-MM-DD format.';
      }
    }
    return null;
  }

  async function handleRegister() {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
    setLoading(true);
    try {
      const payload: Parameters<typeof authApi.register>[0] = {
        role,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      };
      if (role === 'patient') {
        payload.date_of_birth = `${dateOfBirth}T00:00:00`;
        payload.address = address.trim() || undefined;
      }
      const res = await authApi.register(payload);
      await signIn(res.access_token, res.user);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = ROLES.find(r => r.value === role)!;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSub}>Join the Care Assistant platform</Text>
          </View>

          {/* Role selector */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>I am registering as…</Text>
            <View style={styles.roleRow}>
              {ROLES.map(r => {
                const selected = role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.roleCard,
                      selected && {
                        borderColor: r.color,
                        backgroundColor: r.color + '12',
                      },
                    ]}
                    onPress={() => setRole(r.value)}
                    activeOpacity={0.75}>
                    <Text style={styles.roleIcon}>{r.icon}</Text>
                    <Text
                      style={[
                        styles.roleLabel,
                        selected && {color: r.color, fontWeight: '700'},
                      ]}>
                      {r.label}
                    </Text>
                    <Text style={styles.roleDesc}>{r.description}</Text>
                    {selected && (
                      <View
                        style={[styles.roleCheck, {backgroundColor: r.color}]}>
                        <Text style={styles.roleCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Personal details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Jane"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Smith"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 555 000 0000"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />

            {/* Patient-only fields */}
            {role === 'patient' && (
              <>
                <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="1950-01-15"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="123 Main St, City, State"
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={2}
                />
              </>
            )}
          </View>

          {/* Account credentials */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Credentials</Text>

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password * (min 8 chars)</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.btn,
              {backgroundColor: selectedRole.color},
              loading && styles.btnDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.btnText}>
                {selectedRole.icon} Register as {selectedRole.label}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.primary},
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 16,
  },

  // Header
  header: {marginBottom: SPACING.lg},
  backBtn: {marginBottom: SPACING.sm},
  backBtnText: {color: 'rgba(255,255,255,0.85)', fontSize: 15},
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerSub: {fontSize: 14, color: 'rgba(255,255,255,0.7)'},

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Role selector
  roleRow: {flexDirection: 'row', gap: SPACING.sm},
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: 'center',
    position: 'relative',
  },
  roleIcon: {fontSize: 28, marginBottom: 4},
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  roleDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  roleCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCheckText: {fontSize: 10, color: COLORS.white, fontWeight: '700'},

  // Form
  row: {flexDirection: 'row', gap: SPACING.sm},
  halfField: {flex: 1},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputMulti: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

  // Submit
  btn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDisabled: {opacity: 0.6},
  btnText: {fontSize: 16, fontWeight: '700', color: COLORS.white},

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  footerText: {fontSize: 14, color: 'rgba(255,255,255,0.75)'},
  footerLink: {fontSize: 14, fontWeight: '700', color: COLORS.white},
});
