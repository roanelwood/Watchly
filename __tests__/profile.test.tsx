import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import ProfilePage from "../app/(tabs)/profile";

const mockPush = jest.fn();
const mockSetPreference = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);
let mockAuthStateUser: any = null;

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/context/theme-preference", () => ({
  useThemePreference: () => ({
    colorScheme: "dark",
    preference: "system",
    setPreference: mockSetPreference,
  }),
}));

jest.mock("@/firebaseConfig", () => ({
  auth: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((_auth: any, callback: (user: any) => void) => {
    callback(mockAuthStateUser);
    return jest.fn();
  }),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStateUser = {
      email: "test@watchly.app",
      displayName: "Tester",
    };
  });

  it("renders profile heading, user details and action buttons", async () => {
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      expect(getByText("👤 Profile")).toBeTruthy();
      expect(getByText("Tester")).toBeTruthy();
      expect(getByText("test@watchly.app")).toBeTruthy();
      expect(getByText("View Watchlist")).toBeTruthy();
      expect(getByText("View Favourites")).toBeTruthy();
      expect(getByText("Sign Out")).toBeTruthy();
    });
  });

  it("navigates to watchlist and favourites", async () => {
    const { getByText } = render(<ProfilePage />);

    fireEvent.press(getByText("View Watchlist"));
    fireEvent.press(getByText("View Favourites"));

    expect(mockPush).toHaveBeenCalledWith("/watchlist");
    expect(mockPush).toHaveBeenCalledWith("/favourites");
  });

  it("allows selecting system preference and signing out", async () => {
    const { getByText } = render(<ProfilePage />);

    fireEvent.press(getByText("Use system setting (active)"));
    fireEvent.press(getByText("Sign Out"));

    expect(mockSetPreference).toHaveBeenCalledWith("system");
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
