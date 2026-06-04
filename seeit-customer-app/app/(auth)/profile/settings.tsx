import { Redirect } from 'expo-router';

// "Settings" landing page just bounces to the relevant sub-page; the main
// settings list lives on the Profile tab itself.
export default function SettingsRedirect() {
  return <Redirect href="/(public)/(tabs)/profile" />;
}
