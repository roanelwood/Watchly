import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({
  rating,
  onRatingChange,
  size = 32,
  readonly = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const handlePress = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <View style={styles.container}>
      {stars.map((star) => {
        const filled = star <= rating;
        const halfFilled = star - 0.5 === rating;

        return (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            disabled={readonly}
            activeOpacity={0.7}
          >
            <Text style={[styles.star, { fontSize: size }]}>
              {filled ? "★" : halfFilled ? "⯨" : "☆"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
  },
  star: {
    color: "#FFD700",
  },
});
