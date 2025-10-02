import {
  Alert,
  Button,
  View,
  Text,
  ScrollView,
  NativeModules
} from 'react-native';
import paymentsStyles from '../styles/PaymentsStyles';

export default function TabTwoScreen({ navigation }: Readonly<{ navigation?: any }>) {
  const { FragmentLauncher } = NativeModules;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={paymentsStyles.titleContainer}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Explore</Text>
      </View>
      <Button
        title="Open Google Pay"
        onPress={() => {
          try {
            FragmentLauncher.showFragment();
          } catch {
            Alert.alert('Error', 'Failed to open native fragment.');
          }
        }}
      />
    </ScrollView>
  );
}
