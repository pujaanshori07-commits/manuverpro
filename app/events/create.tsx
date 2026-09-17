import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date || !location || !city || !category) {
      Alert.alert('Error', 'Mohon lengkapi semua kolom wajib.');
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
          category,
          type: 'Komunitas', // Default for user created
          participants: '0',
          image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80',
          price: 'Gratis',
          creator_id: userData?.user?.id,
          status: 'approved' // Automatically approved for Beta Testing without Admin Panel
        }
      ]);

      if (error) throw error;

      Alert.alert(
        'Event Berhasil Dibuat!',
        'Event Anda telah diterbitkan dan sekarang bisa dilihat di layar Explore.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nama Event *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Misal: Lari Pagi GBK" 
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Penyelenggara (Opsional)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Nama komunitas/personal" 
          placeholderTextColor={Colors.textMuted}
          value={organizer}
          onChangeText={setOrganizer}
        />

        <Text style={styles.label}>Tanggal & Waktu *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Misal: Sabtu, 10 Nov - 06:00 WIB" 
          placeholderTextColor={Colors.textMuted}
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Kategori Olahraga *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Misal: Running, Badminton, dll" 
          placeholderTextColor={Colors.textMuted}
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>Lokasi Spesifik *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Misal: Gate 3, GBK" 
          placeholderTextColor={Colors.textMuted}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Kota *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Misal: Jakarta Selatan" 
          placeholderTextColor={Colors.textMuted}
          value={city}
          onChangeText={setCity}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Memproses...' : 'Submit untuk Verifikasi'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { color: Colors.white, fontSize: 18, fontFamily: Typography.fontHeading, fontWeight: '700' },
  content: { padding: Spacing.base, paddingBottom: 100 },
  label: { color: Colors.textSecondary, marginBottom: 8, fontSize: 14, fontWeight: '500' },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    color: Colors.white,
    padding: 14,
    marginBottom: 20,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' }
});
