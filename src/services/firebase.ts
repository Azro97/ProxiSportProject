// src/services/firebase.ts
// @react-native-firebase initializes automatically via native config files:
//   Android: android/app/google-services.json
//   iOS:     ios/GoogleService-Info.plist
// No explicit init call is needed here.
//
// All Firestore access goes through the service files (matchsService, terrainsService, equipesService).
// Components and stores never import from @react-native-firebase directly.

export {}; // keep this file as the named entry point for firebase references
