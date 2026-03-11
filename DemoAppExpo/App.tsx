// Re-export root layout for tests and tooling that expect an App entry point.
// The actual app entry is expo-router/entry (see package.json "main").
export { default } from './app/_layout';
