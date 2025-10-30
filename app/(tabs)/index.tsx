import { StyleSheet, Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Welcome to Watchly</Text>
      <Text style={styles.subtitle}>
        Track, rate, and discover films with AI-powered recommendations.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
});
