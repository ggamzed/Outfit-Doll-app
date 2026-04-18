import { View, Text } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF1493' }}>Login screen</Text>
      <Text style={{ marginTop: 10 }}>Tab bar is hidden here.</Text>
    </View>
  );
}