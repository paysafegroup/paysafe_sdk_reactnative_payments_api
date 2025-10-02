import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  NativeModules
} from 'react-native';

import CardDetailScreen from './cardDetailScreen';
import paymentsStyles from '../styles/PaymentsStyles';

import visaLogo from '../assets/images/visa.png';
import mastercardLogo from '../assets/images/mastercard.png';
import amexLogo from '../assets/images/amex.png';
import defaultLogo from '../assets/images/default.png';

const { PaysafeSavedCardPayments } = NativeModules;

interface SavedCard {
  id: string | number;
  creditCardType: 'VISA' | 'MASTERCARD' | 'AMEX' | string;
  lastDigits: string;
  holderName: string;
  expiryMonth: string | number;
  expiryYear: string | number;
}

const cardLogos: Record<string, ImageSourcePropType> = {
  VISA: visaLogo,
  MASTERCARD: mastercardLogo,
  AMEX: amexLogo,
  DEFAULT: defaultLogo,
};

const SavedCardScreen = () => {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState<{ screen: string; params?: any }[]>([{ screen: 'List' }]);

  const cvvRef = useRef(null);

  const fetchCards = useCallback(async () => {
    try {
      const cards: SavedCard[] = await PaysafeSavedCardPayments.fetchSavedCards('profileId');
      setSavedCards(cards);
    } catch {
      Alert.alert('Error', 'Failed to fetch saved cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const push = (screen: string, params?: any) => {
    setStack(prev => [...prev, { screen, params }]);
  };

  const pop = () => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const handleCardPress = (card: SavedCard) => {
    setTimeout(() => {
      push('CardDetail', { card });
    }, 100);
  };

  const renderCardItem = useCallback(({ item }: { item: SavedCard }) => {
    const brandImage = cardLogos[item.creditCardType] || cardLogos.DEFAULT;

    return (
      <TouchableOpacity
        onPress={() => handleCardPress(item)}
        style={paymentsStyles.savedCardWrapperContainer}
      >
        <Image
          source={brandImage}
          style={paymentsStyles.brandIcon}
          resizeMode="contain"
        />
        <View style={paymentsStyles.cardInfo}>
          <Text style={paymentsStyles.cardDigits}>*{item.lastDigits}</Text>
          <Text style={paymentsStyles.cardHolder}>{item.holderName}</Text>
          <Text style={paymentsStyles.expiry}>
            {item.expiryMonth}-{item.expiryYear}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  const keyExtractor = (item: SavedCard, index: number) =>
    item.id?.toString() || index.toString();

  if (loading) {
    return (
      <View style={paymentsStyles.container}>
        <ActivityIndicator size="large" color="#5A2D82" />
      </View>
    );
  }

  const currentScreen = stack[stack.length - 1];

  if (currentScreen.screen === 'CardDetail' && currentScreen.params?.card) {
    return (
      <CardDetailScreen
        card={currentScreen.params.card}
        onBack={pop}
        cvvRef={cvvRef}
      />
    );
  }

  return (
    <View style={paymentsStyles.savedCardContainer}>
      <FlatList
        data={savedCards}
        keyExtractor={keyExtractor}
        renderItem={renderCardItem}
      />
    </View>
  );
};

export default SavedCardScreen;
