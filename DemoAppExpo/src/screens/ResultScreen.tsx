import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Text, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type ResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

const ResultScreen = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();

  const { success, message, timestamp } = route.params;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Details Screen</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={success ? styles.successTitle : styles.errorTitle}>
            {success ? 'Success!' : 'Error'}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={success ? styles.successValue : styles.errorValue}>
              {success ? 'Successful' : 'Failed'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Message:</Text>
            <Text style={styles.detailValue}>{message}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Timestamp:</Text>
            <Text style={styles.detailValue}>{formatDate(timestamp)}</Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('Home')}
        style={styles.button}
      >
        Back to Home
      </Button>
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
  card: {
    marginBottom: 24,
  },
  successTitle: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
  },
  errorTitle: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  successValue: {
    color: 'green',
    fontWeight: 'bold',
  },
  errorValue: {
    color: 'red',
    fontWeight: 'bold',
  },
  button: {
    marginBottom: 24,
  },
});

export default ResultScreen;
