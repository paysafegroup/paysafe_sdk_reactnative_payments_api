import { StyleSheet } from 'react-native';

const paymentsStyles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  savedCardContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  savedCardWrapperContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  savedCardDetailsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  paymentHandleToken: {
   fontSize: 14,
   marginBottom: 20,
   color: 'green',
  },
  brandIcon: {
    width: 80,
    height: 48,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardDigits: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardHolder: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  expiry: {
    fontSize: 12,
    color: '#666',
  },
});

export default paymentsStyles;
