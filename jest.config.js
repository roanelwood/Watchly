module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation|expo|expo-router|expo-modules-core|@expo|react-native-gesture-handler|react-native-reanimated)/)",
  ],
};
