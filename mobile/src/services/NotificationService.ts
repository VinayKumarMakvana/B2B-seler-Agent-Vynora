import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { io } from 'socket.io-client';
import { config } from '../config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static socket: any = null;

  static async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    return true;
  }

  // Connects to the real NestJS Websocket backend
  static startApprovalPoller() {
    if (this.socket) return;
    
    this.socket = io(config.WS_URL);
    
    this.socket.on('connect', () => {
      console.log('Connected to Vynora AI Core Websocket');
    });

    this.socket.on('APPROVAL_NEEDED', async (data: any) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "AI BDM Needs Approval 🚨",
          body: data.message || "New strategy requires your signature.",
          data: { screen: 'Approvals' },
        },
        trigger: null, // Send immediately
      });
    });

    this.socket.on('URGENT_ACTION', async (data: any) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title || "🔥 Hot Lead Alert",
          body: data.message,
          data: { screen: 'CRM', leadId: data.leadId },
        },
        trigger: null, // Send immediately
      });
    });

    this.socket.on('PAYMENT_PROOF_RECEIVED', async (data: any) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💰 Payment Proof Uploaded!",
          body: `${data.companyName} uploaded proof for ${data.method === 'binance' ? 'Binance Pay' : 'PayPal'}. Verify now!`,
          data: { screen: 'CRM', leadId: data.leadId, proofUrl: data.proofUrl },
        },
        trigger: null, // Send immediately
      });
    });
  }
}
