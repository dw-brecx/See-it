import { Redirect } from 'expo-router';

// Send users straight into the public tab navigator. Auth-gated actions
// (save, review, order) trigger sign-in inline.
export default function Index() {
  return <Redirect href="/(public)/(tabs)/home" />;
}
