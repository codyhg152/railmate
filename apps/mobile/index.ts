// Import polyfills FIRST before any other imports
import './src/lib/polyfills';

import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import React from 'react';

// Must be exported or Fast Refresh will fail.
export function App() {
  const ctx = (require as any).context('./src/app');
  return React.createElement(ExpoRoot, { context: ctx });
}

registerRootComponent(App);
