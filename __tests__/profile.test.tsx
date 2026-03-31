import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import ProfilePage from "../app/(tabs)/profile";

const mockPush = jest.fn();
const mockSetPreference = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockOnSnapshot = jest.fn();
let mockAuthStateUser: any = null;

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/context/theme-preference", () => ({
  useThemePreference: () => ({
    colorScheme: "dark",
    preference: "dark",
    setPreference: mockSetPreference,
  }),
}));

jest.mock("@/firebaseConfig", () => ({
  auth: {},
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
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
      uid: "user-1",
      email: "test@watchly.app",
      displayName: "Tester",
    };

    mockCollection.mockImplementation((_db: any, ...segments: string[]) => ({
      path: segments.join("/"),
    }));
    mockQuery.mockImplementation((ref: any) => ref);
    mockOrderBy.mockImplementation(() => ({}));
    mockOnSnapshot.mockImplementation((target: any, onNext: any) => {
      const isWatchlist = target?.path?.includes("/watchlist");
      onNext({
        docs: [
          {
            id: isWatchlist ? "w1" : "f1",
            data: () => ({
              movieId: isWatchlist ? 1997 : 550,
              title: isWatchlist ? "Titanic" : "Fight Club",
              poster_path: null,
            }),
          },
        ],
      });
      return jest.fn();
    });
  });

  it("renders user heading, list previews and action buttons", async () => {
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      expect(getByText("Tester")).toBeTruthy();
      expect(getByText("test@watchly.app")).toBeTruthy();
      expect(getByText("Watchlist")).toBeTruthy();
      expect(getByText("Favourites")).toBeTruthy();
      expect(getByText("Titanic")).toBeTruthy();
      expect(getByText("Fight Club")).toBeTruthy();
      expect(getByText("Sign out")).toBeTruthy();
    });
  });

  it("navigates to watchlist and favourites", async () => {
    const { getAllByText } = render(<ProfilePage />);

    const viewAllButtons = getAllByText("View full");
    fireEvent.press(viewAllButtons[0]);
    fireEvent.press(viewAllButtons[1]);

    expect(mockPush).toHaveBeenCalledWith("/watchlist");
    expect(mockPush).toHaveBeenCalledWith("/favourites");
  });

  it("allows toggling dark mode and signing out", async () => {
    const { getByText } = render(<ProfilePage />);

    fireEvent.press(getByText("Dark mode: On"));
    fireEvent.press(getByText("Sign out"));

    expect(mockSetPreference).toHaveBeenCalledWith("light");
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
