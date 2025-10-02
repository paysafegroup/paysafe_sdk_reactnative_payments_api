# React Native Paysafe Apple Pay

## Overview
The `paysafe-google-pay` package is part of the **Paysafe PH mobile react native SDK**.
It provides a React Native integration for ApplePay using Paysafe mobile SDK.
It allows developers to easily implement Apple pay functionality in their React Native applications.

## Installation

To install the package, run the following command:

```bash
npm install @paysafe/paysafe-apple-pay@current-version
```

### iOS Setup

1. Ensure you have CocoaPods installed. If not, install it using:

   ```bash
   sudo gem install cocoapods
   ```

2. Navigate to the `ios` directory of your project and run:

   ```bash
   pod install
   ```

3. Add the necessary capabilities for Apple Pay in your Xcode project.

### Android Setup

This package is not supported for Android.

## Usage

To use the package in your React Native application, import it as follows:

```javascript
import PaysafeApplePay from 'react-native-paysafe-apple-pay';
```

### Example

Here is a simple example of how to initiate an Apple Pay transaction:

```javascript
const initiateApplePay = async () => {
  try {
    const response = await PaysafeApplePay.requestPayment({
      // Payment details here
    });
    console.log('Payment successful:', response);
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## API Reference

### `requestPayment(options: PaymentOptions): Promise<PaymentResponse>`

- **options**: An object containing payment details.
- **returns**: A promise that resolves with the payment response.
- 
## Documentation

For more information on getting started with the ApplePay package of Paysafe PH mobile react native SDK, please refer to the following link:

[Documentation](add link to developer portal documentation for apple pay)

[Introduction to Paysafe PH mobile react native SDK](add link to developer portal documentation)
