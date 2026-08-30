import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassPanel } from '../components/GlassPanel';
import { colors } from '../theme/colors';
import { config } from '../config';
import { Ionicons } from '@expo/vector-icons';
import { AgentStatusPanel } from '../components/AgentStatusPanel';

const ProgressRing = ({ progress, size = 140, strokeWidth = 16 }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeProgress = Math.max(0, Math.min(progress || 0, 1));
  const strokeDashoffset = circumference - safeProgress * circumference;

  return (
    <View style={styles.ringContainer}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        {/* Glow */}
        <Circle
          stroke="rgba(249, 115, 22, 0.2)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth + 10}
        />
        <Circle
          stroke={colors.surfaceBorder}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke="url(#grad)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringTextContainer}>
        <Text style={styles.ringText}>
          {Math.round(safeProgress * 100)}%
        </Text>
      </View>
    </View>
  );
};

export function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [targetStats, setTargetStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [pipeRes, targetRes] = await Promise.all([
        fetch(`${config.API_URL}/analytics/pipeline`),
        fetch(`${config.API_URL}/analytics/target`)
      ]);
      setStats(await pipeRes.json());
      setTargetStats(await targetRes.json());
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>VYNORA</Text>
        <Text style={styles.headerSubtitle}>COMMAND CENTER</Text>
      </View>
      
      <AgentStatusPanel />

      {/* High-Level Target Tracker */}
      <GlassPanel style={styles.card} intensity={40}>
        <View style={styles.targetRow}>
          <ProgressRing progress={targetStats?.progress || 0} />
          <View style={styles.targetDetails}>
            <Text style={styles.cardTitle}>Monthly Target</Text>
            <Text style={styles.targetValue}>
              ${targetStats?.currentProfit ? targetStats.currentProfit.toLocaleString() : '0'}
            </Text>
            <Text style={styles.targetSubtitle}>of $30,000 USD</Text>
            <View style={styles.badge}>
              <Ionicons name="trending-up" size={14} color={colors.accent} />
              <Text style={styles.badgeText}>On Track</Text>
            </View>
          </View>
        </View>
      </GlassPanel>

      <View style={styles.gridRow}>
        <GlassPanel style={[styles.card, { flex: 1, marginRight: 8 }]} intensity={30}>
          <LinearGradient
            colors={['rgba(249, 115, 22, 0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Active Leads</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.accent }]}>{stats ? stats.kpis?.totalLeads : '-'}</Text>
          <Text style={styles.cardSubtitle}>In Sequence</Text>
        </GlassPanel>

        <GlassPanel style={[styles.card, { flex: 1, marginLeft: 8 }]} intensity={30}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Win Rate</Text>
          </View>
          <Text style={[styles.cardValue, { color: colors.primary }]}>{stats ? stats.kpis?.winRate : '-'}</Text>
          <Text style={styles.cardSubtitle}>Automated</Text>
        </GlassPanel>
      </View>
      
      <GlassPanel style={styles.card} intensity={30}>
         <LinearGradient
            colors={['rgba(225, 29, 72, 0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
         <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color={colors.danger} />
            <Text style={styles.cardTitle}>Pending Approvals</Text>
         </View>
        <Text style={[styles.cardValue, { color: '#fff' }]}>{stats ? stats.kpis?.pendingApprovals : '-'}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Action required to unblock AI</Text>
      </GlassPanel>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  headerRow: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 3,
    marginTop: 4,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: '900',
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetDetails: {
    marginLeft: 24,
    flex: 1,
  },
  targetValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
  },
  targetSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  badgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTextContainer: {
    position: 'absolute',
  },
  ringText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  }
});
