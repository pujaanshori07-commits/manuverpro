import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

const CATEGORIES = ['Semua', 'Running', 'Badminton', 'Gym', 'Futsal', 'Basket', 'Tennis'];

interface SportEvent {
  id: string;
  title: string;
  organizer: string;
  date: string;
  location: string;
  city: string;
  category: string;
  type: 'Kompetisi' | 'Fun Run' | 'Open Tournament' | 'Komunitas' | 'Festival';
  participants: string;
  image: string;
  isFeatured?: boolean;
  price: string;
}

const EVENTS: SportEvent[] = [
  {
    id: 'ev-1',
    title: 'Jakarta Marathon 2026',
    organizer: 'Athletics Indonesia',
    date: '12 Oktober 2026',
    location: 'Bundaran HI, Jakarta Pusat',
    city: 'Jakarta',
    category: 'Running',
    type: 'Fun Run',
    participants: '12.500 peserta',
    image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    price: 'Rp 250.000',
  },
  {
    id: 'ev-2',
    title: 'Badminton Open GBK Cup',
    organizer: 'PBSI DKI Jakarta',
    date: '5–7 Oktober 2026',
    location: 'GBK Arena, Senayan',
    city: 'Jakarta',
    category: 'Badminton',
    type: 'Open Tournament',
    participants: '320 atlet',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    price: 'Rp 150.000 / pasang',
  },
  {
    id: 'ev-3',
    title: 'Bandung Night Run Festival',
    organizer: 'RunBDG Community',
    date: '19 Oktober 2026',
    location: 'Lapangan Gasibu, Bandung',
    city: 'Bandung',
    category: 'Running',
    type: 'Festival',
    participants: '5.000 peserta',
    image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&q=80',
    price: 'Rp 175.000',
  },
  {
    id: 'ev-4',
    title: 'Surabaya Futsal Championship',
    organizer: 'PSSI Surabaya',
    date: '26–27 Oktober 2026',
    location: 'Lapangan Futsal Bung Tomo',
    city: 'Surabaya',
    category: 'Futsal',
    type: 'Kompetisi',
    participants: '64 tim',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    price: 'Rp 500.000 / tim',
  },
  {
    id: 'ev-5',
    title: '3×3 Basketball Jakarta Open',
    organizer: 'Perbasi DKI',
    date: '2 November 2026',
    location: 'Pantai Karnaval, Ancol',
    city: 'Jakarta',
    category: 'Basket',
    type: 'Open Tournament',
    participants: '48 tim',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    price: 'Rp 300.000 / tim',
  },
  {
    id: 'ev-6',
    title: 'Yogyakarta Tennis Open 2026',
    organizer: 'Pelti DIY',
    date: '8–10 November 2026',
    location: 'Gor Klebengan, Yogyakarta',
    city: 'Yogyakarta',
    category: 'Tennis',
    type: 'Open Tournament',
    participants: '128 peserta',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    price: 'Rp 200.000',
  },
  {
    id: 'ev-7',
    title: 'Gym Fest Bali 2026',
    organizer: 'Bali Fitness Community',
    date: '15 November 2026',
    location: 'Seminyak Square, Bali',
    city: 'Bali',
    category: 'Gym',
    type: 'Festival',
    participants: '800 peserta',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    price: 'Gratis',
  },
  {
    id: 'ev-8',
    title: 'Bekasi Half Marathon',
    organizer: 'Komunitas Lari Bekasi',
    date: '22 November 2026',
    location: 'Summarecon Mall Bekasi',
    city: 'Bekasi',
    category: 'Running',
    type: 'Fun Run',
    participants: '3.000 peserta',
    image: 'https://images.unsplash.com/photo-1594882645126-14ac19a33f3e?auto=format&fit=crop&w=800&q=80',
    price: 'Rp 125.000',
  },
];

const TYPE_COLORS: Record<string, string> = {
  Kompetisi: '#FF453A',
  'Fun Run': '#30D158',
  'Open Tournament': '#FF9F0A',
  Komunitas: '#64D2FF',
  Festival: '#BF5AF2',
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const filteredEvents =
    selectedCategory === 'Semua'
      ? EVENTS
      : EVENTS.filter((e) => e.category === selectedCategory);

  const featured = selectedCategory === 'Semua' ? EVENTS.find((e) => e.isFeatured) : null;
  const listEvents = selectedCategory === 'Semua'
    ? EVENTS.filter((e) => !e.isFeatured)
    : filteredEvents;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Event & kompetisi olahraga terkini</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} accessibilityLabel="Notifikasi">
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        style={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Featured Event */}
        {featured && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🔥 Event Unggulan</Text>
            <View style={styles.featuredCard}>
              <Image source={{ uri: featured.image }} style={styles.featuredImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(9,10,13,0.55)', 'rgba(9,10,13,0.98)']}
                locations={[0, 0.45, 1]}
                style={styles.featuredGradient}
              >
                <View style={styles.featuredBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[featured.type] + '33', borderColor: TYPE_COLORS[featured.type] }]}>
                    <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[featured.type] }]}>{featured.type}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Ionicons name="fitness-outline" size={11} color={Colors.primary} />
                    <Text style={styles.categoryBadgeText}>{featured.category}</Text>
                  </View>
                </View>

                <Text style={styles.featuredTitle}>{featured.title}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{featured.date}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{featured.city}</Text>
                </View>

                <View style={styles.featuredFooter}>
                  <View style={styles.participantBadge}>
                    <Ionicons name="people-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.participantText}>{featured.participants}</Text>
                  </View>
                  <View style={styles.registerBtn}>
                    <Text style={styles.registerBtnText}>Daftar · {featured.price}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Event List */}
        <View style={styles.section}>
          {selectedCategory === 'Semua' && (
            <Text style={styles.sectionLabel}>📅 Semua Event</Text>
          )}
          {listEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={44} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Belum ada event</Text>
              <Text style={styles.emptySubtitle}>Event untuk kategori ini segera hadir. Pantau terus!</Text>
            </View>
          ) : (
            listEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Image source={{ uri: event.image }} style={styles.eventImage} resizeMode="cover" />
                <View style={styles.eventInfo}>
                  <View style={styles.eventTopRow}>
                    <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[event.type] + '22', borderColor: TYPE_COLORS[event.type] }]}>
                      <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[event.type] }]}>{event.type}</Text>
                    </View>
                    <Text style={styles.eventPrice}>{event.price}</Text>
                  </View>

                  <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                  <Text style={styles.eventOrganizer}>{event.organizer}</Text>

                  <View style={styles.eventMeta}>
                    <View style={styles.eventMetaItem}>
                      <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.eventMetaText}>{event.date}</Text>
                    </View>
                    <View style={styles.eventMetaItem}>
                      <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.eventMetaText} numberOfLines={1}>{event.city}</Text>
                    </View>
                  </View>

                  <View style={styles.eventMetaItem}>
                    <Ionicons name="people-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.eventMetaText}>{event.participants}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: { paddingBottom: 4 },
  categoryList: {
    paddingHorizontal: Spacing.base,
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  pillActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  pillText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.base },
  section: { marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  featuredCard: {
    height: 260,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  featuredImage: { ...StyleSheet.absoluteFillObject },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.base,
    justifyContent: 'flex-end',
  },
  featuredBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.md,
  },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  metaDot: { color: Colors.textSecondary, fontSize: 12 },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  participantText: { fontSize: 12, color: Colors.textSecondary },
  registerBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.round,
  },
  registerBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.md,
  },
  eventImage: { width: 105, height: 130 },
  eventInfo: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  eventTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: Colors.white, lineHeight: 20, marginBottom: 2 },
  eventOrganizer: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  eventPrice: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  eventMeta: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { fontSize: 11, color: Colors.textSecondary, flexShrink: 1 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
});

