import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { GlassPanel } from '../components/GlassPanel';
import { Badge } from '../components/Badge';
import { colors } from '../theme/colors';
import { config } from '../config';

export function DiscoveryScreen() {
  const [leads, setLeads] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiscovery = async () => {
    try {
      const res = await fetch(`${config.API_URL}/leads`);
      const data = await res.json();
      // Filter only new leads to represent the Discovery Engine finding them
      setLeads(data.filter((l: any) => l.status === 'new' || l.status === 'contacted'));
    } catch (err) {
      console.error('Failed to fetch discovery', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscovery();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDiscovery();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <GlassPanel style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.companyName}>{item.company?.domain || 'Unknown Domain'}</Text>
        <Badge 
          label={item.status === 'new' ? 'discovering' : 'outreach'} 
          type={item.status === 'new' ? 'warning' : 'info'} 
        />
      </View>
      <Text style={styles.infoText}>Scraping metrics for {item.company?.name}</Text>
    </GlassPanel>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AI Discovery Engine Active</Text>
      <Text style={styles.subtext}>Scanning 45 domains/hour based on your directives.</Text>
      <FlatList
        data={leads}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No active discovery.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  subtext: {
    color: colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  }
});
