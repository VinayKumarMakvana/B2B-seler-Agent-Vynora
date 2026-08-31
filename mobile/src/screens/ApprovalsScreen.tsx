import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { GlassPanel } from '../components/GlassPanel';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { config } from '../config';
import { EmptyState } from '../components/EmptyState';

export function ApprovalsScreen() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

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

  const handleInputChange = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleExecuteAction = async (id: string, requestedAction: string) => {
    const data = formData[id] || {};
    
    if (requestedAction === 'provide_meeting_details' && (!data.time || !data.link)) {
      Alert.alert('Required', 'Please provide both meeting time and link.');
      return;
    }
    if (requestedAction === 'provide_proposal' && (!data.price || !data.scope)) {
      Alert.alert('Required', 'Please provide both price and scope.');
      return;
    }

    try {
      await fetch(`${config.API_URL}/approvals/${id}/execute-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setNegotiations(prev => prev.filter(n => n.id !== id));
      Alert.alert('Executed', `Agent is drafting the email and sending it!`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to execute action');
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

  const renderActionForm = (item: any) => {
    const data = formData[item.id] || {};
    
    if (item.requestedAction === 'provide_meeting_details') {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Provide Meeting Details</Text>
          <TextInput 
            style={styles.input} 
            placeholder="E.g., Tomorrow at 2 PM EST" 
            placeholderTextColor="#888"
            value={data.time || ''}
            onChangeText={(v) => handleInputChange(item.id, 'time', v)}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Meeting Link (Google Meet/Zoom)" 
            placeholderTextColor="#888"
            value={data.link || ''}
            onChangeText={(v) => handleInputChange(item.id, 'link', v)}
          />
        </View>
      );
    }

    if (item.requestedAction === 'provide_proposal') {
      const budget = item.proposedContent?.extractedBudget || 'Unknown';
      return (
        <View style={styles.formContainer}>
          <View style={styles.insightBox}>
             <Text style={styles.insightLabel}>CLIENT BUDGET</Text>
             <Text style={styles.insightText}>{budget}</Text>
          </View>
          <Text style={styles.formTitle}>Define Proposal Scope</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Price (e.g., $1,500/mo)" 
            placeholderTextColor="#888"
            value={data.price || ''}
            onChangeText={(v) => handleInputChange(item.id, 'price', v)}
          />
          <TextInput 
            style={[styles.input, { height: 80 }]} 
            placeholder="Scope of work (Bullet points)" 
            placeholderTextColor="#888"
            multiline
            value={data.scope || ''}
            onChangeText={(v) => handleInputChange(item.id, 'scope', v)}
          />
        </View>
      );
    }

    // Default fallback
    return (
      <Text style={styles.scopeText} numberOfLines={2}>
        {item.proposedContent?.hookText || item.proposedContent?.bumpText || JSON.stringify(item.proposedContent)}
      </Text>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <GlassPanel style={styles.card} intensity={30}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
           <View style={styles.iconCircle}>
              <Ionicons name="flash" size={18} color={colors.accent} />
           </View>
           <Text style={styles.companyName}>
             {item.requestedAction === 'provide_meeting_details' ? 'MEETING REQUEST' : 
              item.requestedAction === 'provide_proposal' ? 'PROPOSAL REQUEST' : 
              'ACTION REQUIRED'}
           </Text>
        </View>
        <View style={styles.badgeRisk}>
          <Text style={styles.badgeRiskText}>URGENT</Text>
        </View>
      </View>

      <Text style={styles.clientMessageText} numberOfLines={4}>
        "{item.proposedContent?.clientMessage || 'System action required'}"
      </Text>

      {renderActionForm(item)}
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.approveBtnContainer} onPress={() => handleExecuteAction(item.id, item.requestedAction)}>
          <LinearGradient
            colors={['#9333ea', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.approveGradient}
          >
            <Text style={styles.approveText}>Format & Send</Text>
            <Ionicons name="send" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </GlassPanel>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
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
            description="Agent is handling all communications autonomously." 
          />
        }
      />
    </KeyboardAvoidingView>
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
    fontSize: 14,
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
    padding: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981', // Green for money
  },
  clientMessageText: {
    fontSize: 15,
    color: '#e2e8f0',
    marginBottom: 16,
    fontStyle: 'italic',
    lineHeight: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
  },
  scopeText: {
    fontSize: 15,
    color: '#e2e8f0',
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  formTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
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
  }
});
