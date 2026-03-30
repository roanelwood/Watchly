import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import SearchPage from "../app/(tabs)/search";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "dark",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

describe("SearchPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => ({ results: [] }),
    });
  });

  it("renders search header and default empty state", () => {
    const { getByText, getByPlaceholderText } = render(<SearchPage />);

    expect(getByText("🔎 Search Movies")).toBeTruthy();
    expect(getByText("Search for movies")).toBeTruthy();
    expect(getByPlaceholderText("Search for movies...")).toBeTruthy();
  });

  it("switches to AI mode and updates placeholder and hint", () => {
    const { getByText, getByPlaceholderText } = render(<SearchPage />);

    fireEvent.press(getByText("AI Search"));

    expect(
      getByPlaceholderText("e.g. dark psychological sci-fi thrillers"),
    ).toBeTruthy();
    expect(
      getByText(
        "AI Search suggests titles first, then Watchly finds matching TMDB movies.",
      ),
    ).toBeTruthy();
  });

  it("clears search input when clear button is pressed", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SearchPage />);
    const input = getByPlaceholderText("Search for movies...");

    fireEvent.changeText(input, "ab");

    // Find clear button by icon parent touchable based on accessibility hierarchy.
    const clearButton = getByTestId("search-clear-button");
    fireEvent.press(clearButton);

    await waitFor(() => {
      expect(input.props.value).toBe("");
    });
  });
});
