import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../constants/theme';
import { SPORT_TAG_MAP } from '../app/(tabs)/index';

interface SparingInviteCardProps {
  inviteId: string;
  sport: string;
  venueName: string;
  scheduledAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'counter_proposed' | 'cancelled' | 'completed' | 'expired';
  isReceiver: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  note?: string | null;
}

export default function SparingInviteCard({
  sport,
  venueName,
  scheduledAt,
  status,
  isReceiver,
  onAccept,
  onDecline,
  note,
}: SparingInviteCardProps) {
  const sportData = SPORT_TAG_MAP[sport.toLowerCase()] || { name: sport, icon: 'fitness' };
  
  const dateObj = new Date(scheduledAt);
  const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Determine status display
  let statusBadgeColor = Colors.primary;
  let statusText = 'Pending';
  let isExpired = false;

  if (status === 'accepted') {
    statusBadgeColor = Colors.success;
    statusText = 'Diterima';
  } else if (status === 'declined') {
    statusBadgeColor = Colors.danger;
    statusText = 'Ditolak';
  } else if (status === 'cancelled') {
    statusBadgeColor = Colors.textMuted;
    statusText = 'Dibatalkan';
  } else if (status === 'expired' || new Date() > new Date(new Date(scheduledAt).getTime() + 86400000)) {
    // Basic expiry check (24h after scheduled time as a fallback)
    statusBadgeColor = Colors.textMuted;
    statusText = 'Kedaluwarsa';
    isExpired = true;
  }

  const isPending = status === 'pending';

  return (
    <View style={[styles.cardContainer, (isExpired || status === 'declined' || status === 'cancelled') && styles.cardExpired]}>
      {/* Header: Sport & Status */}
      <View style={styles.headerRow}>
        <View style={styles.sportBadge}>
          <Ionicons name={sportData.icon as any} size={16} color={Colors.white} />
          <Text style={styles.sportName}>{sportData.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusBadgeColor}20` }]}>
          <Text style={[styles.statusText, { color: statusBadgeColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          </View>
          <Text style={styles.detailText}>{formattedDate} • {formattedTime}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.iconBox}>
            <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          </View>
          <Text style={styles.detailText}>{venueName}</Text>
        </View>
        
        {note ? (
          <View style={[styles.detailRow, styles.noteRow]}>
            <View style={styles.iconBox}>
              <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.noteText}>"{note}"</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      {isPending && isReceiver && !isExpired && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={onDecline}>
            <Text style={styles.declineText}>Tolak</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
            <Text style={styles.acceptText}>Terima</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPending && !isReceiver && !isExpired && (
        <View style={styles.waitingFooter}>
          <ActivityIndicator size="small" color={Colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
          <Text style={styles.waitingText}>Menunggu respons...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E212A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    width: 280,
    marginVertical: 4,
  },
  cardExpired: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sportName: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
  },
  detailsContainer: {
    padding: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  noteRow: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  noteText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  acceptBtn: {
    backgroundColor: 'rgba(255, 90, 31, 0.1)',
  },
  declineText: {
    fontFamily: Typography.fontMedium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  acceptText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  waitingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  waitingText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
