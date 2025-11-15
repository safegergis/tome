import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Add authentication check here
  // For now, redirecting to welcome screen (authentication flow)
  return <Redirect href="/welcome" />;
}
