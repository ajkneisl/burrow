import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Burrow",
    slug: "burrow",
    version: "0.4.0",
    orientation: "portrait",
    icon: "./assets/images/burrow.png",
    scheme: "burrow",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
        image: "./assets/images/burrow.png",
        resizeMode: "contain",
        backgroundColor: "#7A0019"
    },
    ios: {
        supportsTablet: false,
        bundleIdentifier: "app.umn.burrow",
        associatedDomains: ["applinks:burrow.umn.edu"],
        infoPlist: {
            NSLocationWhenInUseUsageDescription:
                "Burrow needs your location to help you find nearby study groups.",
            NSCameraUsageDescription:
                "Burrow needs camera access to scan QR codes.",
            ITSAppUsesNonExemptEncryption: false
        },
        "entitlements": {
            "com.apple.developer.maps": true
        },
        config: {
            googleMapsApiKey: "AIzaSyBvjCvJM5WjNB_QYKhB-3-RaaWumVZ3mKw"
        }
    },
    android: {
        package: "",
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
        "expo-web-browser",
        "expo-router",
        "expo-font",
        [
            "expo-splash-screen",
            {
                image: "./assets/images/burrow.png",
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
        apiUrl: "https://umn.app/api",
        cdnUrl: "https://cdn.umn.app",
        eas: {
            projectId: "3dc55916-e2a2-4081-a6cd-b76056b7386f"
        }
    }
})
