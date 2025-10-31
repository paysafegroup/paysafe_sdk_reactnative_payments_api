import { View, Text, Button } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import paymentsStyles from '../styles/PaymentsStyles';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();

  return (
    <View style={paymentsStyles.container}>
      <Text style={paymentsStyles.title}>Payment Successful!</Text>
      <Text style={paymentsStyles.message}>Your Venmo payment was successfully processed.</Text>
      {token && (
        <Text style={paymentsStyles.paymentHandleToken}>Token: {token}</Text>
      )}
      <Button title="Go Home" onPress={() => router.push('/')} />
    </View>
  );
}
