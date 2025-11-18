import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const apiKey = '5b08fa299e458e98810648d4daac2ba5';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function MovieRow({ title, genreInfo }: { title: string; genreInfo: { id?: number; url: string } }) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let url = '';
        if (genreInfo.id) {
          url = `https://api.themoviedb.org/3/${genreInfo.url}?api_key=${apiKey}&with_genres=${genreInfo.id}&sort_by=popularity.desc&page=1`;
        } else {
          url = `https://api.themoviedb.org/3/${genreInfo.url}?api_key=${apiKey}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (!mounted) return;
        setMovies(json.results || []);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [genreInfo]);

  if (loading) {
    return (
      <View style={styles.rowContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        <ActivityIndicator style={{ marginVertical: 12 }} />
      </View>
    );
  }

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.rowTitle}>{title}</Text>
      {error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : (
        <FlatList
          data={movies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.posterContainer} activeOpacity={0.8}>
              <Image
                source={{ uri: item.poster_path ? IMAGE_BASE + item.poster_path : undefined }}
                style={styles.poster}
                resizeMode="cover"
              />
              <Text style={styles.posterTitle} numberOfLines={1}>
                {item.title || item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

export default function HomePage() {
  const rows = [
    { title: 'Trending', genreInfo: { url: 'trending/movie/week' } },
    { title: 'Popular', genreInfo: { url: 'movie/popular' } },
    { title: 'Action', genreInfo: { url: 'discover/movie', id: 28 } },
    { title: 'Comedy', genreInfo: { url: 'discover/movie', id: 35 } },
    { title: 'Drama', genreInfo: { url: 'discover/movie', id: 18 } },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 12 }}>
      <View style={styles.header}>
        <Text style={styles.title}>🎬 Welcome to Watchly</Text>
        <Text style={styles.subtitle}>Track, rate, and discover films with AI-powered recommendations.</Text>
      </View>

      {rows.map((r) => (
        <MovieRow key={r.title} title={r.title} genreInfo={r.genreInfo} />
      ))}
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const posterWidth = Math.round(width * 0.28);
const posterHeight = Math.round(posterWidth * 1.5);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090909' },
  header: { paddingHorizontal: 12, paddingVertical: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#aaa', marginTop: 6 },
  rowContainer: { marginTop: 12, paddingVertical: 6 },
  rowTitle: { color: '#fff', fontSize: 18, fontWeight: '600', paddingHorizontal: 12, marginBottom: 8 },
  posterContainer: { width: posterWidth, marginLeft: 12 },
  poster: { width: posterWidth, height: posterHeight, borderRadius: 8, backgroundColor: '#222' },
  posterTitle: { color: '#fff', marginTop: 6, width: posterWidth },
});
