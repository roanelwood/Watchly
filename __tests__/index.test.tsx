import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

const mockAuth = { currentUser: null as any };
let mockAuthStateUser: any = null;

const mockOnSnapshot = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "dark",
}));

jest.mock("@/firebaseConfig", () => ({
  auth: mockAuth,
  db: {},
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((_auth: any, callback: (user: any) => void) => {
    callback(mockAuthStateUser);
    return jest.fn();
  }),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db: any, ...segments: string[]) => ({
    path: segments.join("/"),
  })),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  orderBy: jest.fn(() => ({})),
  query: jest.fn((ref: any) => ref),
}));

const HomePage = require("../app/(tabs)/index").default;

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStateUser = null;
    mockAuth.currentUser = null;
    mockOnSnapshot.mockImplementation(
      (_ref: any, onNext: (snapshot: any) => void) => {
        onNext({ docs: [] });
        return jest.fn();
      },
    );

    (global as any).fetch = jest.fn(() => new Promise(() => {}));
  });

  it("renders welcome text and default content rows", () => {
    const { getByText } = render(<HomePage />);

    expect(getByText("Welcome back")).toBeTruthy();
    expect(getByText("Trending")).toBeTruthy();
    expect(getByText("Popular")).toBeTruthy();
    expect(getByText("Action")).toBeTruthy();
    expect(getByText("Comedy")).toBeTruthy();
    expect(getByText("Drama")).toBeTruthy();
  });

  it("renders watchlist and favourites rows when user has data", async () => {
    mockAuthStateUser = { uid: "user-1", displayName: "Roan" };
    mockAuth.currentUser = mockAuthStateUser;

    mockOnSnapshot.mockImplementation(
      (ref: any, onNext: (snapshot: any) => void) => {
        if (ref.path.endsWith("watchlist")) {
          onNext({
            docs: [
              {
                data: () => ({
                  movieId: 10,
                  title: "Watchlist Movie",
                  poster_path: "/watch.jpg",
                }),
              },
            ],
          });
        } else if (ref.path.endsWith("favourites")) {
          onNext({
            docs: [
              {
                data: () => ({
                  movieId: 20,
                  title: "Favourite Movie",
                  poster_path: "/fav.jpg",
                }),
              },
            ],
          });
        } else {
          onNext({ docs: [] });
        }
        return jest.fn();
      },
    );

    const { getByText } = render(<HomePage />);

    await waitFor(() => {
      expect(getByText("Welcome, Roan!")).toBeTruthy();
      expect(getByText("Your Watchlist")).toBeTruthy();
      expect(getByText("Your Favourites")).toBeTruthy();
    });
  });

  it("navigates to movie details when a watchlist card is pressed", async () => {
    mockAuthStateUser = { uid: "user-1", displayName: "Roan" };
    mockAuth.currentUser = mockAuthStateUser;

    mockOnSnapshot.mockImplementation(
      (ref: any, onNext: (snapshot: any) => void) => {
        if (ref.path.endsWith("watchlist")) {
          onNext({
            docs: [
              {
                data: () => ({
                  movieId: 123,
                  title: "My Pick",
                  poster_path: "/pick.jpg",
                }),
              },
            ],
          });
        } else {
          onNext({ docs: [] });
        }
        return jest.fn();
      },
    );

    const { getByText } = render(<HomePage />);

    await waitFor(() => {
      expect(getByText("My Pick")).toBeTruthy();
    });

    fireEvent.press(getByText("My Pick"));
    expect(mockPush).toHaveBeenCalledWith("/movie/123");
  });
});
