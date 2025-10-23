import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppContext } from '../context/PaysafeContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isLoading } = useAppContext();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Expo Demo App</Text>
        <Text style={styles.headerSubtitle}>Simple Navigation Example</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Welcome to Expo Demo</Text>
          <Text variant="bodyMedium" style={styles.cardDescription}>
            This is a simple demo app built with Expo and React Native Paper
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Result', {
              success: true,
              message: 'Navigation successful!',
              timestamp: new Date().toISOString()
            })}
            disabled={isLoading}
          >
            Go to Details
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium">App Features</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>UI Library:</Text>
            <Text style={styles.infoValue}>React Native Paper</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Navigation:</Text>
            <Text style={styles.infoValue}>React Navigation</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>Expo</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardDescription: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  infoValue: {
    flex: 1,
  },
});

export default HomeScreen;
