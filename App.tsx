// App.tsx

import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import LocationProvider from './src/providers/LocationProvider';

export default function App() {
  return (
    <LocationProvider>
      <RootNavigator />
    </LocationProvider>
  );
}
