import { auth } from '@/firebaseConfig';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/');
      }
    });
    return () => unsub();
  }, [router]);

  const handleSignup = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // normalize username for uniqueness checking 
    const usernameVal = (username || '').trim();
    if (!username || username.trim().length < 3) {
      setError('Please choose a username (at least 3 characters)');
      return;
    }
    setLoading(true);
    try {
      // Create the user account (skipping client-side uniqueness reserve due to RN Firestore limitations).
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Set display name on the Firebase user profile
      try {
        await updateProfile(userCred.user as any, { displayName: usernameVal });
      } catch {
        // ignore update profile failure for now
      }
      // onAuthStateChanged will redirect
    } catch (e: any) {
      console.error('Signup error', e);
      try {
        // show firebase app options for debugging
        // @ts-ignore
        console.log('Firebase app options:', auth?.app?.options);
      } catch {
        // ignore
      }
      // Map common firebase auth errors to friendly messages
      let msg = e?.code || e?.message || 'Signup failed';
      if (e?.code === 'auth/configuration-not-found' || e?.code === 'configuration-not-found') {
        msg = 'Authentication method not configured. Enable Email/Password in Firebase Console -> Authentication -> Sign-in method.';
      } else {
        msg = (msg as string).replace('auth/', '');
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>

      <View style={styles.row}>
        <Text style={styles.note}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text style={styles.link}> Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0B0B0B',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaa',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#111214',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1E90FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  note: { color: '#aaa' },
  link: { color: '#1E90FF', fontWeight: '600' },
  error: { color: '#ff6b6b', marginTop: 8, textAlign: 'center' },
});
