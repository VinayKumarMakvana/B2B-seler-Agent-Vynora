import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { GlassPanel } from '../components/GlassPanel';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { config } from '../config';

export function CrmScreen() {
  const [leads, setLeads] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [projectRequirements, setProjectRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${config.API_URL}/leads`, {
        headers: {
          'Authorization': `Bearer ${config.TOKEN}`
        }
      });
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSaveClient = async () => {
    if (!companyName || !contactEmail) {
      Alert.alert('Error', 'Company Name and Email are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${config.API_URL}/leads`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.TOKEN}`
        },
        body: JSON.stringify({ companyName, contactName, contactEmail, projectRequirements })
      });
      if (res.ok) {
        setModalVisible(false);
        setCompanyName('');
        setContactName('');
        setContactEmail('');
        setProjectRequirements('');
        await fetchLeads();
      } else {
        Alert.alert('Error', 'Failed to save client details.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('closed_won') || status.includes('qualified')) return colors.primary;
    if (status.includes('negotiation') || status.includes('contacted')) return colors.accent;
    if (status.includes('lost') || status.includes('not_interested')) return colors.danger;
    return colors.textSecondary;
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => setSelectedLead(item)} activeOpacity={0.7}>
      <GlassPanel style={styles.card} intensity={20}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
             <View style={[styles.iconCircle, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                <Ionicons name="business" size={18} color={getStatusColor(item.status)} />
             </View>
             <Text style={styles.companyName}>{item.company?.name || 'Unknown Company'}</Text>
          </View>
          <View style={[styles.badge, { borderColor: `${getStatusColor(item.status)}50` }]}>
            <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
              {formatStatus(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.contactInfo}>
          <Ionicons name="person" size={14} color={colors.textSecondary} />
          <Text style={styles.contactText}>{item.contact?.name} • {item.contact?.title || 'Decision Maker'}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Ionicons name="mail" size={14} color={colors.textSecondary} />
          <Text style={styles.contactText}>{item.contact?.email}</Text>
        </View>

        {item.opportunity?.projectRequirements && (
          <View style={styles.reqsContainer}>
            <Text style={styles.reqsTitle}>Project Intel</Text>
            <Text style={styles.reqsText} numberOfLines={2}>{item.opportunity.projectRequirements}</Text>
          </View>
        )}
      </GlassPanel>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={leads}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Ionicons name="people-outline" size={60} color={colors.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No leads in the pipeline yet.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fabContainer} onPress={() => setModalVisible(true)}>
        <LinearGradient
          colors={['#f97316', '#ea580c']}
          style={styles.fab}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* New Prospect Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <LinearGradient
                colors={['rgba(168, 85, 247, 0.1)', 'transparent']}
                style={StyleSheet.absoluteFill}
             />
            <Text style={styles.modalTitle}>New Prospect</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="business" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} placeholder="Company Name *" value={companyName} onChangeText={setCompanyName} />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} placeholder="Contact Name" value={contactName} onChangeText={setContactName} />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} placeholder="Contact Email *" value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Ionicons name="document-text" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput style={[styles.input, styles.textArea]} placeholderTextColor={colors.textSecondary} placeholder="Project Requirements..." value={projectRequirements} onChangeText={setProjectRequirements} multiline numberOfLines={4} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveClient} disabled={isSubmitting}>
                <LinearGradient
                  colors={['#9333ea', '#4f46e5']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>{isSubmitting ? 'Saving...' : 'Add to Pipeline'}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Lead Details Modal */}
      <Modal visible={!!selectedLead} animationType="slide" transparent={true} onRequestClose={() => setSelectedLead(null)}>
        <View style={styles.detailsOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.detailsHeader}>
            <TouchableOpacity onPress={() => setSelectedLead(null)} style={styles.backBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.detailsTitle}>Lead Profile</Text>
            <View style={{ width: 28 }} />
          </View>

          {selectedLead && (
            <View style={styles.detailsContent}>
              <View style={styles.detailsTop}>
                <View style={[styles.iconCircleLarge, { backgroundColor: `${getStatusColor(selectedLead.status)}20` }]}>
                  <Ionicons name="business" size={40} color={getStatusColor(selectedLead.status)} />
                </View>
                <Text style={styles.detailsCompanyName}>{selectedLead.company?.name || 'Unknown'}</Text>
                
                <View style={[styles.badge, { borderColor: `${getStatusColor(selectedLead.status)}50`, marginTop: 12 }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(selectedLead.status), fontSize: 12 }]}>
                    CURRENT STAGE: {formatStatus(selectedLead.status)}
                  </Text>
                </View>
              </View>

              <GlassPanel intensity={30} style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>CONTACT INFO</Text>
                <View style={styles.contactRow}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <Text style={styles.contactDetailText}>{selectedLead.contact?.name || 'N/A'}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="briefcase" size={20} color={colors.primary} />
                  <Text style={styles.contactDetailText}>{selectedLead.contact?.title || 'Decision Maker'}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Ionicons name="mail" size={20} color={colors.primary} />
                  <Text style={styles.contactDetailText}>{selectedLead.contact?.email}</Text>
                </View>
              </GlassPanel>

              <GlassPanel intensity={30} style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>AI ENGAGEMENT STATUS</Text>
                <Text style={styles.aiStatusText}>
                  {selectedLead.status === 'new' && 'AI is currently analyzing this lead and preparing an initial outreach strategy.'}
                  {selectedLead.status === 'outreach_ready' && 'Initial strategy generated. AI is waiting for approval to send the first email.'}
                  {selectedLead.status === 'contacted' && 'Initial outreach sent! AI is actively monitoring inbox for replies.'}
                  {selectedLead.status === 'negotiation' && 'Lead replied. AI is currently negotiating and gathering requirements.'}
                  {selectedLead.status === 'qualified' && 'Lead is fully qualified. High priority.'}
                  {selectedLead.status === 'closed_won' && 'Deal closed successfully! Invoice generated.'}
                  {(!['new','outreach_ready','contacted','negotiation','qualified','closed_won'].includes(selectedLead.status)) && `AI is tracking this lead in stage: ${formatStatus(selectedLead.status)}.`}
                </Text>
              </GlassPanel>

              {selectedLead.opportunity?.projectRequirements && (
                <GlassPanel intensity={30} style={styles.detailsSection}>
                   <Text style={styles.sectionTitle}>DISCOVERED REQUIREMENTS</Text>
                   <Text style={styles.detailsReqsText}>{selectedLead.opportunity.projectRequirements}</Text>
                </GlassPanel>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reqsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(5, 3, 10, 0.6)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  reqsTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  reqsText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    overflow: 'hidden',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  detailsOverlay: {
    flex: 1,
    paddingTop: 60,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  detailsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailsTop: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailsCompanyName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  detailsSection: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contactDetailText: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  aiStatusText: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  detailsReqsText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  }
});
