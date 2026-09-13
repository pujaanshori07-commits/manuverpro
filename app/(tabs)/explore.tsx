import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - Spacing.base * 2, 440);
const CARD_HEIGHT = 170;

const ACTIVITY_CATEGORIES = [
  'Semua',
  'Running',
  'Gym',
  'Badminton',
  'Basket',
  'Yoga',
  'Tennis',
];

interface ExploreCardItem {
  id: string;
  nama: string;
  umur: number;
  aktivitas: string;
  jarak: string;
  foto_url: string;
  isLiked?: boolean;
}

const DEMO_EXPLORE_ITEMS: ExploreCardItem[] = [
  {
    id: 'exp-1',
    nama: 'Nadia',
    umur: 26,
    aktivitas: 'Running',
    jarak: '2 km',
    foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'exp-2',
    nama: 'Raka',
    umur: 27,
    aktivitas: 'Gym',
    jarak: '4 km',
    foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'exp-3',
    nama: 'Dinda',
    umur: 24,
    aktivitas: 'Badminton',
    jarak: '3 km',
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'exp-4',
    nama: 'Budi',
    umur: 28,
    aktivitas: 'Basket',
    jarak: '5 km',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [items, setItems] = useState<ExploreCardItem[]>(DEMO_EXPLORE_ITEMS);
  const [loading, setLoading] = useState(false);

  // Filter Modal selections
  const [modalCategory, setModalCategory] = useState('Semua');
  const [modalGender, setModalGender] = useState('Semua');

  const fetchExploreUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);

      if (error || !data || data.length === 0) {
        setItems(DEMO_EXPLORE_ITEMS);
      } else {
        const formatted: ExploreCardItem[] = data.map((d: any, idx: number) => ({
          id: d.id,
          nama: d.nama || `User ${idx + 1}`,
          umur: d.umur || 25,
          aktivitas: Array.isArray(d.hobi) && d.hobi.length > 0 ? d.hobi[0] : (d.hobi || 'Running'),
          jarak: `${(idx + 1) * 2} km`,
          foto_url: d.foto_url || DEMO_EXPLORE_ITEMS[idx % DEMO_EXPLORE_ITEMS.length].foto_url,
        }));
        setItems(formatted);
      }
    } catch {
      setItems(DEMO_EXPLORE_ITEMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExploreUsers();
  }, [fetchExploreUsers]);

  const toggleLike = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isLiked: !item.isLiked } : item
      )
    );
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'Semua') return true;
    return item.aktivitas.toLowerCase() === selectedCategory.toLowerCase();
  });

  const renderCard = ({ item }: { item: ExploreCardItem }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      <Image source={{ uri: item.foto_url }} style={styles.cardImage} resizeMode="cover" />

      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(9, 10, 13, 0.45)', 'rgba(9, 10, 13, 0.95)']}
        locations={[0, 0.5, 1]}
        style={styles.cardGradient}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.activityBadge}>
            <Ionicons name="fitness-outline" size={12} color={Colors.primary} />
            <Text style={styles.activityBadgeText}>{item.aktivitas}</Text>
          </View>

          <TouchableOpacity
            style={[styles.likeButton, item.isLiked && styles.likeButtonActive]}
            onPress={() => toggleLike(item.id)}
            activeOpacity={0.7}
            accessibilityLabel="Sukai Profil"
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={item.isLiked ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.userNameText}>
              {item.nama}, {item.umur}
            </Text>
            <View style={styles.distanceRow}>
              <Ionicons name="location-sharp" size={12} color={Colors.textSecondary} />
              <Text style={styles.distanceText}>{item.jarak} dari lokasimu</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0D" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Temukan partner olahraga di dekatmu</Text>
        </View>
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Buka Filter"
        >
          <Ionicons name="filter-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {ACTIVITY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Profile Cards Feed */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Tidak ada partner ditemukan</Text>
              <Text style={styles.emptySubtitle}>
                Coba pilih cabang olahraga lain atau perbarui filter pencarianmu.
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Partner</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Kategori Olahraga */}
            <Text style={styles.modalSectionLabel}>Cabang Olahraga</Text>
            <View style={styles.modalGrid}>
              {ACTIVITY_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.modalChip, modalCategory === cat && styles.modalChipActive]}
                  onPress={() => setModalCategory(cat)}
                >
                  <Text style={[styles.modalChipText, modalCategory === cat && styles.modalChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preferensi Gender */}
            <Text style={styles.modalSectionLabel}>Gender</Text>
            <View style={styles.modalGrid}>
              {['Semua', 'Pria', 'Wanita'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.modalChip, modalGender === g && styles.modalChipActive]}
                  onPress={() => setModalGender(g)}
                >
                  <Text style={[styles.modalChipText, modalGender === g && styles.modalChipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terapkan CTA */}
            <TouchableOpacity
              style={styles.modalApplyButton}
              onPress={() => {
                setSelectedCategory(modalCategory);
                setFilterModalVisible(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalApplyButtonText}>Terapkan Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  categoryScrollWrapper: {
    paddingVertical: Spacing.sm,
  },
  categoryList: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  categoryPillActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  feedContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    gap: Spacing.md,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.base,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(9, 10, 13, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(9, 10, 13, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButtonActive: {
    backgroundColor: 'rgba(255, 87, 47, 0.25)',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 6,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.base,
  },
  modalChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.elevatedSurface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  modalChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalApplyButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  modalApplyButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
