import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TouchableOpacity, Alert } from 'react-native';
import { GlassPanel } from '../components/GlassPanel';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { config } from '../config';

export function InvoicesScreen() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${config.API_URL}/invoices`);
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleVerify = async (invoiceId: string) => {
    try {
      await fetch(`${config.API_URL}/payments/${invoiceId}/verify`, { method: 'POST' });
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
      ));
      Alert.alert('Verified', 'Payment marked as Paid and Revenue updated!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to verify payment');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <GlassPanel style={styles.card} intensity={25}>
      <LinearGradient
        colors={item.status === 'paid' ? ['rgba(147, 51, 234, 0.1)', 'transparent'] : ['rgba(249, 115, 22, 0.1)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: item.status === 'paid' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(249, 115, 22, 0.15)' }]}>
             <Ionicons name="receipt" size={16} color={item.status === 'paid' ? colors.primary : colors.warning} />
          </View>
          <Text style={styles.companyName}>{item.lead?.company?.name || 'Unknown'}</Text>
        </View>
        <Text style={[styles.amount, { color: item.status === 'paid' ? '#fff' : colors.warning }]}>
          ${item.amountUsd?.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.footerRow}>
        <Text style={styles.dateText}>INV-{item.id.substring(0, 6).toUpperCase()}</Text>
        <View style={[styles.badge, { borderColor: item.status === 'paid' ? 'rgba(147, 51, 234, 0.3)' : 'rgba(249, 115, 22, 0.3)' }]}>
          <Text style={[styles.badgeText, { color: item.status === 'paid' ? colors.primary : colors.warning }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {item.status === 'verification_pending' && item.proofUrl && (
        <View style={styles.verificationSection}>
          <Text style={styles.proofTitle}>Payment Proof Uploaded</Text>
          <Image 
            source={{ uri: `${config.WS_URL}${item.proofUrl}` }} 
            style={styles.proofImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.verifyBtnContainer} onPress={() => handleVerify(item.id)}>
             <LinearGradient
                colors={['#9333ea', '#4f46e5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.verifyBtnGradient}
             >
               <Text style={styles.verifyBtnText}>Verify & Mark Paid</Text>
               <Ionicons name="checkmark-done" size={18} color="#fff" />
             </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </GlassPanel>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
           <View style={{ alignItems: 'center', marginTop: 100 }}>
             <Ionicons name="receipt-outline" size={60} color={colors.textSecondary} style={{ marginBottom: 16 }} />
             <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No invoices found.</Text>
           </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    marginBottom: 20,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 20,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  verificationSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  proofTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  proofImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  verifyBtnContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  verifyBtnGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  }
});
