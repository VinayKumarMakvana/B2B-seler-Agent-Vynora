import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform, Animated } from 'react-native';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { CrmScreen } from './src/screens/CrmScreen';
import { ApprovalsScreen } from './src/screens/ApprovalsScreen';
import { InvoicesScreen } from './src/screens/InvoicesScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors } from './src/theme/colors';
import { NotificationService } from './src/services/NotificationService';
import { config } from './src/config';

const Tab = createBottomTabNavigator();

const VynoraTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: '#121212',
    text: colors.textPrimary,
    primary: colors.accent,
  },
};

export default function App() {
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);

  useEffect(() => {
    // Setup Push Notifications on App Boot
    NotificationService.requestPermissions().then((granted) => {
      if (granted) {
        NotificationService.startApprovalPoller();
      }
    });
  }, []);

  if (!authToken) {
    return <LoginScreen onLogin={(token, u) => {
      setAuthToken(token);
      setUser(u);
      config.TOKEN = token; // Globally setting token for fetch logic
    }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={VynoraTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: {
              backgroundColor: '#05030a',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(168, 85, 247, 0.1)',
              shadowColor: 'transparent',
              elevation: 0,
            },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '900', fontSize: 20, letterSpacing: 1 },
            tabBarShowLabel: false,
            tabBarStyle: {
              position: 'absolute',
              bottom: 30,
              left: 24,
              right: 24,
              elevation: 0,
              backgroundColor: 'transparent',
              borderRadius: 40,
              height: 70,
              borderTopWidth: 0,
            },
            tabBarBackground: () => (
              <View style={styles.blurContainer}>
                <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.5)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.tabBorder} />
              </View>
            ),
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: any = 'home';
              if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
              else if (route.name === 'Approvals') iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
              else if (route.name === 'CRM') iconName = focused ? 'people' : 'people-outline';
              else if (route.name === 'Invoices') iconName = focused ? 'receipt' : 'receipt-outline';

              return (
                <View style={styles.iconWrapper}>
                  <Ionicons name={iconName} size={28} color={focused ? '#fff' : color} style={focused ? styles.iconActive : null} />
                  {focused && (
                    <View style={styles.activeIndicator}>
                      <LinearGradient colors={[colors.accent, colors.primary]} style={StyleSheet.absoluteFill} start={{x:0, y:0}} end={{x:1, y:0}} />
                    </View>
                  )}
                </View>
              );
            },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Approvals" component={ApprovalsScreen} />
          <Tab.Screen name="CRM" component={CrmScreen} />
          <Tab.Screen name="Invoices" component={InvoicesScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 3, 10, 0.7)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  tabBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 12,
  },
  iconActive: {
    textShadowColor: 'rgba(249, 115, 22, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  }
});
