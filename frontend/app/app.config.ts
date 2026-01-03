import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Burrow",
    slug: "burrow",
    version: "0.4.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "burrow",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#7A0019"
    },
    ios: {
        bundler: "metro",
        supportsTablet: true,
        bundleIdentifier: "com.umn.burrow",
        associatedDomains: ["applinks:burrow.umn.edu"],
        infoPlist: {
            NSLocationWhenInUseUsageDescription:
                "Burrow needs your location to help you find nearby study groups.",
            NSCameraUsageDescription:
                "Burrow needs camera access to scan QR codes."
        },
        config: {
            googleMapsApiKey:
                process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS || ""
        }
    },
    android: {
        package: "com.umn.burrow",
        adaptiveIcon: {
            backgroundColor: "#7A0019",
            foregroundImage: "./assets/images/android-icon-foreground.png",
            backgroundImage: "./assets/images/android-icon-background.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        permissions: [
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "CAMERA"
        ],
        intentFilters: [
            {
                action: "VIEW",
                autoVerify: true,
                data: [
                    {
                        scheme: "https",
                        host: "umn.app"
                    },
                    {
                        scheme: "burrow"
                    }
                ],
                category: ["BROWSABLE", "DEFAULT"]
            }
        ],
        config: {
            googleMaps: {
                apiKey:
                    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID || ""
            }
        }
    },
    web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png"
    },
    plugins: [
        "expo-router",
        "expo-font",
        [
            "expo-splash-screen",
            {
                image: "./assets/images/splash-icon.png",
                imageWidth: 200,
                resizeMode: "contain",
                backgroundColor: "#7A0019",
                dark: {
                    backgroundColor: "#4E000A"
                }
            }
        ],
        [
            "expo-notifications",
            {
                icon: "./assets/images/notification-icon.png",
                color: "#7A0019",
                sounds: []
            }
        ],
        [
            "expo-location",
            {
                locationAlwaysAndWhenInUsePermission:
                    "Allow Burrow to use your location to find nearby study groups."
            }
        ]
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true
    },
    extra: {
        router: {
            origin: false
        },
        apiUrl: "http://localhost:8080/api",
        eas: {
            projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || ""
        }
    }
})
