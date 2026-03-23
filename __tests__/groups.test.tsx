import { render } from "@testing-library/react-native";
import React from "react";
import GroupsPage from "../app/(tabs)/groups";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/firebaseConfig", () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  increment: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(),
  where: jest.fn(),
}));

describe("GroupsPage", () => {
  it("renders the Groups title", () => {
    const { getByText } = render(<GroupsPage />);

    expect(getByText("Groups")).toBeTruthy();
  });

  it("renders the create and join actions", () => {
    const { getByText } = render(<GroupsPage />);

    expect(getByText("Create group")).toBeTruthy();
    expect(getByText("Join with code")).toBeTruthy();
  });

  it("shows empty state when there are no groups", () => {
    const { getByText } = render(<GroupsPage />);

    expect(getByText("No groups yet.")).toBeTruthy();
  });

  it("renders the subtitle text", () => {
    const { getByText } = render(<GroupsPage />);

    expect(getByText("Create a group or join with a code.")).toBeTruthy();
  });

  it("renders the Your groups section header", () => {
    const { getByText } = render(<GroupsPage />);

    expect(getByText("Your groups")).toBeTruthy();
  });
});
