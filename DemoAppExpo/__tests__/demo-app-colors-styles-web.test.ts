import { Colors } from '@/constants/Colors';
import paymentsStyles from '@/styles/PaymentsStyles';

describe('Colors', () => {
  it('defines light and dark palettes with expected keys', () => {
    expect(Colors.light).toMatchObject({
      text: expect.any(String),
      background: expect.any(String),
      tint: expect.any(String),
      icon: expect.any(String),
      tabIconDefault: expect.any(String),
      tabIconSelected: expect.any(String),
    });
    expect(Colors.dark).toMatchObject({
      text: expect.any(String),
      background: expect.any(String),
      tint: expect.any(String),
    });
  });
});

describe('PaymentsStyles', () => {
  it('exports StyleSheet keys used by payment screens', () => {
    expect(paymentsStyles.container).toBeDefined();
    expect(paymentsStyles.title).toBeDefined();
    expect(paymentsStyles.savedCardContainer).toBeDefined();
    expect(paymentsStyles.savedCardDetailsContainer).toBeDefined();
    expect(paymentsStyles.paymentHandleToken).toBeDefined();
  });
});
