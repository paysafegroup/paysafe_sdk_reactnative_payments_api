# Paysafe React Native Demo App

This is a demo application showcasing the integration of the Paysafe SDK with React Native.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the App

```bash
npm start
```

Then, follow the instructions to run the app on your preferred platform (iOS, Android, or web).

## Testing

The project includes a comprehensive test suite using Jest and React Native Testing Library.

### Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To run tests with coverage:

```bash
npm run test:coverage
```

### Test Structure

- `__tests__/app-structure.test.tsx` – File structure (expo-router app layout)
- `__tests__/basic.test.tsx` – Basic sanity tests
- `__tests__/components.test.tsx` – UI components
- `__tests__/context.test.tsx` – Context provider (mock SDK)
- `__tests__/hooks.test.tsx` – Custom hooks
- `__tests__/paysafe-sdk.test.tsx` – Mock SDK integration
- `__tests__/screens.test.tsx` – Screen/validation behavior
- `__tests__/sdk-basic.test.tsx` – SDK basics
- `__tests__/simple.test.tsx`, `__tests__/simple-app.test.tsx` – Simple checks
- `components/__tests__/` – ThemedText, ThemedView
- `hooks/__tests__/` – useColorScheme, useThemeColor

## Project Structure

- **`app/`** – Expo Router (file-based routing)
  - `_layout.tsx` – Root layout, fonts, theme
  - `(tabs)/_layout.tsx` – Tab navigator
  - `(tabs)/index.tsx` – Payments tab (card payments, Venmo, Google Pay)
  - `paymentSuccessScreen.tsx` – Payment success
  - `savedCardScreen.tsx` – Saved cards list
  - `cardDetailScreen.tsx` – Card detail / pay with saved card
  - `+not-found.tsx` – 404 screen
- **`components/`** – Reusable UI (ThemedText, ThemedView, ParallaxScrollView, IconSymbol, HapticTab, TabBarBackground)
- **`constants/`** – Colors
- **`hooks/`** – useColorScheme, useThemeColor
- **`styles/`** – PaymentsStyles
- **`__mocks__/`** – Test-only mock SDK (`paysafe-sdk.ts`)

## Features

- Card payment (Paysafe Card Payments SDK)
- Venmo and Google Pay
- Saved cards and payment success flows
- Themed UI and validation

## License

This project is licensed under the MIT License - see the LICENSE file for details.