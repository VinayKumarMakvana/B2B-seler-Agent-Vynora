import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader = ({ width = '100%', height = 80, borderRadius = 12, style }: SkeletonProps) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.7, duration: 800, useNativeDriver: false }),
        Animated.timing(opacityAnim, { toValue: 0.3, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[
      styles.skeleton, 
      { width, height, borderRadius, opacity: opacityAnim },
      style
    ]} />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
});
