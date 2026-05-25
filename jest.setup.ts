jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@/src/database", () => require("@/src/database.web"));

jest.mock("firebase/auth", () => ({
  signInAnonymously: jest.fn().mockResolvedValue({ user: { uid: "test-anon-uid" } }),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getDownloadURL: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

const mockVectorIcon = () => {
  const React = require("react");
  const { Text } = require("react-native");
  return (props: { name?: string }) =>
    React.createElement(Text, null, props.name ?? "");
};

jest.mock("@expo/vector-icons", () => ({
  Ionicons: mockVectorIcon(),
  MaterialIcons: mockVectorIcon(),
  FontAwesome: mockVectorIcon(),
}));

jest.mock("@expo/vector-icons/Ionicons", () => mockVectorIcon());

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    },
    useLocalSearchParams: () => ({ id: "1" }),
    Link: ({ children }: { children: React.ReactNode }) => children,
    Stack: Object.assign(
      ({ children }: { children: React.ReactNode }) => children,
      { Screen: () => null },
    ),
    Tabs: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

jest.mock("react-native-google-mobile-ads", () => ({
  MobileAds: () => ({
    initialize: jest.fn().mockResolvedValue(undefined),
  }),
  BannerAd: () => null,
  BannerAdSize: {},
  TestIds: { BANNER: "test-banner" },
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-background-fetch", () => ({
  BackgroundFetchResult: { NewData: 1, NoData: 2, Failed: 3 },
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-av", () => ({
  Video: () => null,
  ResizeMode: { CONTAIN: "contain" },
  Audio: {
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
}));

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockMap = (props: object) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMap,
    PROVIDER_GOOGLE: "google",
  };
});

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: -37.81, longitude: 144.96 },
  }),
  Accuracy: { Balanced: 3 },
}));

jest.mock("expo-camera", () => ({
  CameraView: () => null,
  useCameraPermissions: () => [
    { granted: true, canAskAgain: true },
    jest.fn(),
  ],
  CameraType: { back: "back", front: "front" },
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: "Images", Videos: "Videos" },
}));

jest.mock("expo-sensors", () => ({
  Accelerometer: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    setUpdateInterval: jest.fn(),
    isAvailableAsync: jest.fn().mockResolvedValue(true),
  },
  Gyroscope: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    setUpdateInterval: jest.fn(),
    isAvailableAsync: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock("rive-react-native", () => ({
  Rive: () => null,
}));

jest.mock("react-native-vision-camera", () => ({
  Camera: () => null,
  useCameraDevice: () => null,
  useCameraPermission: () => ({
    hasPermission: true,
    requestPermission: jest.fn(),
  }),
}));

jest.mock("@/src/firebase", () => ({
  app: null,
  auth: { currentUser: { uid: "test-anon-uid" } },
  db: null,
  cloudStorage: null,
  storage: null,
  isFirebaseConfigured: false,
  isFirebaseStorageReady: false,
}));

jest.mock("@/src/utils/mobileAds", () => ({
  initializeMobileAds: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/src/utils/notifications", () => ({
  requestNotificationPermissions: jest.fn().mockResolvedValue(undefined),
  addNotificationUrlListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleStreakReminderNotification: jest.fn(),
  cancelChallengeNotifications: jest.fn(),
}));

jest.mock("@/src/tasks/streakReminderTask", () => ({
  STREAK_REMINDER_TASK: "streak-reminder-background",
  registerStreakReminderTask: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/src/services/challengeCloudSync", () => ({
  processPendingChallengeCloudSync: jest
    .fn()
    .mockResolvedValue({ attempted: 0, cleared: 0 }),
  syncChallengeResultToCloud: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/src/services/mediaUploadQueue", () => ({
  processPendingMediaUploads: jest
    .fn()
    .mockResolvedValue({ attempted: 0, completed: 0, remaining: 0 }),
  enqueueMediaUploadsForResult: jest.fn().mockResolvedValue(0),
}));
