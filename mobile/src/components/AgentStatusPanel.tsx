import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AgentStatus {
  isRunning: boolean;
  activeModel: 'ollama' | 'gemini';
  currentTask: string;
}

export const AgentStatusPanel = () => {
  const [status, setStatus] = useState<AgentStatus>({
    isRunning: true,
    activeModel: 'ollama',
    currentTask: 'Connecting to AI Engine...',
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const switchAnim = useRef(new Animated.Value(status.activeModel === 'gemini' ? 1 : 0)).current;

  // Pulse animation for the glowing orb
  useEffect(() => {
    if (status.isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status.isRunning]);

  // Polling for real-time state from backend
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // We use localhost or the explicit IP
        const ip = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
        const res = await fetch(`http://${ip}:3001/api/v1/agent/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (error) {
        console.warn('Agent Status API not reachable yet.');
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleAgent = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newIsRunning = !status.isRunning;
    // Optimistic update
    setStatus(prev => ({ ...prev, isRunning: newIsRunning, currentTask: newIsRunning ? 'Waking up...' : 'Stopped' }));
    
    try {
      const ip = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      await fetch(`http://${ip}:3001/api/v1/agent/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRunning: newIsRunning })
      });
    } catch (e) {
      console.warn('Failed to toggle agent');
    }
  };

  const toggleModel = async () => {
    Haptics.selectionAsync();
    const newModel = status.activeModel === 'ollama' ? 'gemini' : 'ollama';
    setStatus(prev => ({ ...prev, activeModel: newModel }));
    
    Animated.spring(switchAnim, {
      toValue: newModel === 'gemini' ? 1 : 0,
      useNativeDriver: false,
      friction: 5,
    }).start();

    try {
      const ip = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      await fetch(`http://${ip}:3001/api/v1/agent/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel })
      });
    } catch (e) {
      console.warn('Failed to switch model');
    }
  };

  return (
    <BlurView intensity={20} tint="dark" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="hardware-chip-outline" size={20} color="#E0E0E0" />
          <Text style={styles.title}>Vynora AI Brain</Text>
        </View>
        
        <Pressable onPress={toggleAgent} style={styles.powerButton}>
          <Ionicons name="power" size={18} color={status.isRunning ? "#4CAF50" : "#F44336"} />
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Animated.View style={[
          styles.orb, 
          { 
            backgroundColor: status.isRunning ? '#4CAF50' : '#F44336',
            transform: [{ scale: pulseAnim }],
            shadowColor: status.isRunning ? '#4CAF50' : '#F44336',
          }
        ]} />
        <Text style={styles.currentTask} numberOfLines={1} ellipsizeMode="tail">
          {status.currentTask}
        </Text>
      </View>

      <View style={styles.modelSwitcher}>
        <Text style={styles.modelLabel}>Engine:</Text>
        <Pressable onPress={toggleModel} style={styles.switchTrack}>
          <Animated.View style={[
            styles.switchThumb,
            {
              transform: [{
                translateX: switchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, 62],
                })
              }]
            }
          ]} />
          <View style={styles.switchLabels}>
            <Text style={[styles.switchText, status.activeModel === 'ollama' && styles.activeSwitchText]}>Ollama</Text>
            <Text style={[styles.switchText, status.activeModel === 'gemini' && styles.activeSwitchText]}>Gemini</Text>
          </View>
        </Pressable>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(15, 15, 25, 0.6)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  powerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 12,
  },
  orb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  currentTask: {
    color: '#B0B0B0',
    fontSize: 13,
    flex: 1,
  },
  modelSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelLabel: {
    color: '#9E9E9E',
    fontSize: 13,
  },
  switchTrack: {
    width: 130,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  switchThumb: {
    width: 64,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 13,
    position: 'absolute',
  },
  switchLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  switchText: {
    color: '#757575',
    fontSize: 12,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
  },
  activeSwitchText: {
    color: '#FFFFFF',
  }
});
