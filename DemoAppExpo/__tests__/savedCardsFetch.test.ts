import { fetchSavedCards } from '@/utils/savedCards/fetchSavedCards';
import { mapSingleUseCustomerTokensToSavedCards } from '@/utils/savedCards/mapSavedCards';

const TEST_API_KEY = 'test-api-key-base64';
const TEST_PROFILE_ID = 'demo-profile-id';

describe('mapSingleUseCustomerTokensToSavedCards', () => {
  it('maps visa handle fields used by the demo screens', () => {
    const cards = mapSingleUseCustomerTokensToSavedCards({
      singleUseCustomerToken: 'sut_tok',
      paymentHandles: [
        {
          id: 'ph-1',
          paymentHandleToken: 'ph_tok',
          card: {
            cardType: 'VI',
            lastDigits: '4242',
            holderName: 'Test User',
            cardExpiry: { month: '12', year: '2030' },
          },
        },
      ],
    });

    expect(cards).toEqual([
      {
        id: 'ph-1',
        creditCardType: 'VISA',
        lastDigits: '4242',
        holderName: 'Test User',
        expiryMonth: '12',
        expiryYear: '2030',
        expiryDate: '12-2030',
        paymentHandleTokenFrom: 'ph_tok',
        singleUseCustomerToken: 'sut_tok',
      },
    ]);
  });

  it('maps mastercard and amex codes and uses display fallbacks', () => {
    const cards = mapSingleUseCustomerTokensToSavedCards({
      paymentHandles: [
        { card: { cardType: 'MC' } },
        { card: { cardType: 'AM' } },
        { card: { cardType: 'unknown-brand' } },
        {},
      ],
    });

    expect(cards.map((c) => c.creditCardType)).toEqual([
      'MASTERCARD',
      'AMEX',
      'UNKNOWN-BRAND',
      'UNKNOWN',
    ]);
    expect(cards[3].lastDigits).toBe('0000');
    expect(cards[3].holderName).toBe('Holder Name');
    expect(cards[3].expiryDate).toBe('12-2099');
    expect(cards[3].id).toBe('3');
  });

  it('returns an empty list when the payload has no handles', () => {
    expect(mapSingleUseCustomerTokensToSavedCards(null)).toEqual([]);
    expect(mapSingleUseCustomerTokensToSavedCards({})).toEqual([]);
  });
});

describe('fetchSavedCards', () => {
  const origEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...origEnv };
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = TEST_API_KEY;
    process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'TEST';
    process.env.EXPO_PUBLIC_PAYSAFE_PROFILE_ID = TEST_PROFILE_ID;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = origEnv;
    global.fetch = originalFetch;
  });

  it('posts to the test Payment Hub endpoint with Basic auth', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        singleUseCustomerToken: 'sut',
        paymentHandles: [
          {
            id: '1',
            paymentHandleToken: 'tok',
            card: { cardType: 'VI', lastDigits: '1111', holderName: 'A', cardExpiry: { month: '01', year: '2031' } },
          },
        ],
      }),
    });

    const cards = await fetchSavedCards();

    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.test.paysafe.com/paymenthub/v1/customers/${TEST_PROFILE_ID}/singleusecustomertokens`,
      expect.objectContaining({
        method: 'POST',
        body: '{}',
        headers: expect.objectContaining({
          Authorization: `Basic ${TEST_API_KEY}`,
          Simulator: 'EXTERNAL',
        }),
      })
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].creditCardType).toBe('VISA');
    expect(cards[0].paymentHandleTokenFrom).toBe('tok');
  });

  it('uses production host and keeps an existing Basic prefix', async () => {
    process.env.EXPO_PUBLIC_PAYSAFE_ENVIRONMENT = 'PROD';
    process.env.EXPO_PUBLIC_PAYSAFE_API_KEY = 'Basic already-prefixed';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ paymentHandles: [] }),
    });

    await fetchSavedCards();

    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.paysafe.com/paymenthub/v1/customers/${TEST_PROFILE_ID}/singleusecustomertokens`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Basic already-prefixed',
        }),
      })
    );
  });

  it('rejects when profile id is missing', async () => {
    delete process.env.EXPO_PUBLIC_PAYSAFE_PROFILE_ID;
    await expect(fetchSavedCards()).rejects.toThrow('EXPO_PUBLIC_PAYSAFE_PROFILE_ID');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects when API key is missing', async () => {
    delete process.env.EXPO_PUBLIC_PAYSAFE_API_KEY;
    await expect(fetchSavedCards()).rejects.toThrow('EXPO_PUBLIC_PAYSAFE_API_KEY');
  });

  it('rejects when the HTTP response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });
    await expect(fetchSavedCards()).rejects.toThrow('Failed to fetch saved cards (401)');
  });
});
