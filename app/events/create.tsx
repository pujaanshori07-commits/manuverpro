import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const COLORS = {
  bg: '#080A0F',
  surface: '#11141C',
  surfaceAlt: '#0C0F17',
  border: '#272C38',
  textMain: '#F5F7FA',
  textMuted: '#969EAE',
  primary: '#FF5A36', // Manuver Orange
  primarySoft: 'rgba(255, 90, 54, 0.12)',
};

type Mode = 'USER' | 'COMPS';

const TABS: { key: Mode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'USER', label: 'USER', icon: 'people-outline' },
  { key: 'COMPS', label: 'COMPS', icon: 'trophy-outline' },
];

const SPORTS = ['Padel', 'Tennis', 'Badminton', 'Futsal', 'Basket', 'Running', 'Lainnya'];
const USER_TYPES = ['Social', 'Americano', 'Doubles', 'Class'];
const COMP_FORMATS = ['Knockout', 'Round Robin', 'Liga'];

const IMAGES: Record<Mode, string> = {
  USER: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80',
  COMPS: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80',
};

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('USER');
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [sport, setSport] = useState('');
  const [quota, setQuota] = useState('');
  const [price, setPrice] = useState('');

  // Mode-specific
  const [userType, setUserType] = useState('Social');
  const [compFormat, setCompFormat] = useState('Knockout');

  const isComps = mode === 'COMPS';

  const handleSubmit = async () => {
    if (!title || !date || !location || !city || !sport || (isComps && !organizer)) {
      Alert.alert('Data belum lengkap', 'Mohon lengkapi semua kolom bertanda *.');
      return;
    }

    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('events').insert([
        {
          title,
          organizer: organizer || userData?.user?.email?.split('@')[0] || 'Unknown',
          date,
          location,
          city,
          category: sport,
          type: isComps ? `Kompetisi · ${compFormat}` : `Komunitas · ${userType}`,
          participants: quota ? `0/${quota}` : '0',
          image_url: IMAGES[mode],
          price: price ? `Rp ${price}` : 'Gratis',
          creator_id: userData?.user?.id,
          status: 'approved', // Auto-approved for beta (no admin panel yet)
        },
      ]);

      if (error) throw error;

      Alert.alert(
        isComps ? 'Kompetisi Dibuat!' : 'Meet Dibuat!',
        'Sekarang sudah bisa dilihat di layar Explore.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderChips = (options: string[], value: string, onChange: (v: string) => void) => (
    <View style={styles.chipsRow}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            id={`chip-${opt.toLowerCase().replace(/\s/g, '-')}`}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    keyboardType: 'default' | 'numeric' = 'default'
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity id="create-close-btn" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Baru</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* 2 Tabs: USER / COMPS */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const active = mode === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              id={`tab-${tab.key.toLowerCase()}`}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setMode(tab.key)}
            >
              <Ionicons name={tab.icon} size={16} color={active ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info banner */}
      <View style={styles.banner}>
        <MaterialCommunityIcons
          name={isComps ? 'trophy-variant' : 'account-group'}
          size={22}
          color={COLORS.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{isComps ? 'Buat Kompetisi' : 'Buat Meet / Sparing'}</Text>
          <Text style={styles.bannerSub}>
            {isComps
              ? 'Turnamen dengan format, kuota tim & biaya pendaftaran.'
              : 'Ajak pemain lain main bareng santai atau sparing.'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderInput(
            isComps ? 'Nama Kompetisi *' : 'Judul Meet *',
            title,
            setTitle,
            isComps ? 'Misal: Padel Cup Bandung 2026' : 'Misal: Mabar Padel Pagi 2 Jam',
            'create-outline'
          )}

          <Text style={styles.label}>Olahraga *</Text>
          {renderChips(SPORTS, sport, setSport)}

          <Text style={styles.label}>{isComps ? 'Format Kompetisi' : 'Tipe Meet'}</Text>
          {isComps
            ? renderChips(COMP_FORMATS, compFormat, setCompFormat)
            : renderChips(USER_TYPES, userType, setUserType)}

          {renderInput(
            isComps ? 'Penyelenggara *' : 'Host (Opsional)',
            organizer,
            setOrganizer,
            isComps ? 'Nama klub / EO' : 'Nama kamu / komunitas',
            'person-outline'
          )}

          {renderInput('Tanggal & Waktu *', date, setDate, 'Misal: Sabtu, 10 Nov - 06:00', 'calendar-outline')}
          {renderInput('Venue *', location, setLocation, 'Misal: Suka Padel Club', 'location-outline')}
          {renderInput('Kota *', city, setCity, 'Misal: Bandung', 'business-outline')}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {renderInput(
                isComps ? 'Kuota Tim' : 'Kuota Pemain',
                quota,
                setQuota,
                isComps ? '16' : '8',
                'people-outline',
                'numeric'
              )}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput(
                isComps ? 'Biaya Daftar' : 'Biaya / Orang',
                price,
                setPrice,
                'Kosong = Gratis',
                'cash-outline',
                'numeric'
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky submit */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          id="create-submit-btn"
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={isComps ? 'trophy' : 'add-circle'} size={20} color="#fff" />
              <Text style={styles.submitBtnText}>{isComps ? 'Buat Kompetisi' : 'Buat Meet'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: { padding: 4 },
  headerTitle: { color: COLORS.textMain, fontSize: 17, fontWeight: '700' },

  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  tabTextActive: { color: COLORS.primary },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bannerTitle: { color: COLORS.textMain, fontSize: 15, fontWeight: '700' },
  bannerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  content: { padding: 16 },
  field: { marginBottom: 18 },
  label: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: COLORS.textMain, fontSize: 15, paddingVertical: 13 },
  row: { flexDirection: 'row', gap: 12 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
