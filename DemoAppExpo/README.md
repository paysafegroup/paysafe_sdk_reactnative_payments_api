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

- `__tests__/App.test.tsx`: Tests for the main App component
- `__tests__/components.test.tsx`: Tests for UI components
- `__tests__/context.test.tsx`: Tests for the Paysafe context provider
- `__tests__/hooks.test.tsx`: Tests for custom hooks
- `__tests__/paysafe-sdk.test.tsx`: Tests for the Paysafe SDK integration
- `__tests__/screens.test.tsx`: Tests for screen components
- `__tests__/simple.test.tsx`: Basic tests for verification

## Project Structure

- `src/components`: UI components
- `src/context`: Context providers
- `src/hooks`: Custom hooks
- `src/screens`: Screen components
- `src/sdk`: Mock SDK implementation for testing

## Features

- Card payment processing
- Payment validation
- Transaction history
- Error handling

## License

This project is licensed under the MIT License - see the LICENSE file for details.