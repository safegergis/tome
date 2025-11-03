import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Add authentication check here
  // For now, redirecting to home to showcase the homepage design
  return <Redirect href="/home" />;
}
