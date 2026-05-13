// App.tsx

import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import LocationProvider from './src/app/providers/LocationProvider';

export default function App() {
  return (
    <LocationProvider>
      <RootNavigator />
    </LocationProvider>
  );
}
