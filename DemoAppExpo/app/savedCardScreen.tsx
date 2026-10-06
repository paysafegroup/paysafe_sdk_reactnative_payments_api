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
} from 'react-native';

import CardDetailScreen from './cardDetailScreen';
import paymentsStyles from '../styles/PaymentsStyles';
import { fetchSavedCards } from '../utils/savedCards/fetchSavedCards';
import type { SavedCard } from '../utils/savedCards/savedCardsTypes';

import visaLogo from '../assets/images/visa.png';
import mastercardLogo from '../assets/images/mastercard.png';
import amexLogo from '../assets/images/amex.png';
import defaultLogo from '../assets/images/default.png';

type StackParams = { card?: SavedCard };

const cardLogos: Record<string, ImageSourcePropType> = {
  VISA: visaLogo,
  MASTERCARD: mastercardLogo,
  AMEX: amexLogo,
  DEFAULT: defaultLogo,
};

const SavedCardScreen = () => {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState<{ screen: string; params?: StackParams }[]>([{ screen: 'List' }]);

  const cvvRef = useRef(null);

  const fetchCards = useCallback(async () => {
    try {
      const cards = await fetchSavedCards();
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

  const push = (screen: string, params?: StackParams) => {
    setStack(prev => [...prev, { screen, params }]);
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
