export const config = {
  // Use EXPO_PUBLIC_API_URL defined in mobile/.env
  // Make sure it points to your computer's local IP if testing on a physical device!
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api/v1',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'http://10.0.2.2:3001',
  TOKEN: null as string | null,
};
