import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { GlassPanel } from '../components/GlassPanel';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { config } from '../config';
import { EmptyState } from '../components/EmptyState';

export function ApprovalsScreen() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNegotiations = async () => {
    try {
      const res = await fetch(`${config.API_URL}/approvals`);
      const data = await res.json();
      setNegotiations(data);
    } catch (err) {
      console.error('Failed to load approvals', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNegotiations();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await fetch(`${config.API_URL}/approvals/${id}/approve`, { method: 'POST' });
      setNegotiations(prev => prev.filter(n => n.id !== id));
      Alert.alert('Approved', `AI actions approved for execution!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`${config.API_URL}/approvals/${id}/reject`, { method: 'POST' });
      setNegotiations(prev => prev.filter(n => n.id !== id));
      Alert.alert('Rejected', `AI strategy rejected.`);
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <GlassPanel style={styles.card} intensity={30}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
           <View style={styles.iconCircle}>
              <Ionicons name="flash" size={18} color={colors.accent} />
           </View>
           <Text style={styles.companyName}>{item.entityType?.replace(/_/g, ' ').toUpperCase() || 'PROPOSAL'}</Text>
        </View>
        <View style={styles.badgeRisk}>
          <Text style={styles.badgeRiskText}>{item.riskLevel || 'HIGH'} RISK</Text>
        </View>
      </View>

      <View style={styles.insightBox}>
         <Text style={styles.insightLabel}>AI REASONING</Text>
         <Text style={styles.insightText} numberOfLines={3}>{item.aiReasoning || "No reasoning provided."}</Text>
      </View>

      <Text style={styles.scopeText} numberOfLines={2}>
        {item.proposedContent?.hookText || item.proposedContent?.bumpText || JSON.stringify(item.proposedContent)}
      </Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.approveBtnContainer} onPress={() => handleApprove(item.id)}>
          <LinearGradient
            colors={['#9333ea', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.approveGradient}
          >
            <Text style={styles.approveText}>Approve & Execute</Text>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </GlassPanel>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={negotiations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <EmptyState 
            icon="checkmark-done-circle-outline" 
            title="Inbox Zero!" 
            description="No pending approvals. AI is waiting for new triggers." 
          />
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
    padding: 0, 
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
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  badgeRisk: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  badgeRiskText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
  },
  insightBox: {
    backgroundColor: 'rgba(5, 3, 10, 0.6)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  scopeText: {
    fontSize: 15,
    color: '#e2e8f0',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  approveBtnContainer: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  approveGradient: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approveText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  }
});
