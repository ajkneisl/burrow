import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Burrow",
    slug: "burrow",
    version: "0.5.0",
    orientation: "portrait",
    icon: "./assets/images/burrow.png",
    scheme: "app.umn.burrow",
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
        associatedDomains: ["applinks:umn.app"],
        infoPlist: {
            NSLocationWhenInUseUsageDescription:
                "Burrow needs your location to help you find nearby study groups.",
            NSCameraUsageDescription:
                "Burrow needs camera access to scan QR codes.",
            ITSAppUsesNonExemptEncryption: false
        },
        entitlements: {
            "com.apple.developer.maps": true
        },
        config: {
            googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY
        },
        icon: {
            dark: "./assets/images/burrow-dark.png",
            light: "./assets/images/burrow.png"
        }
    },
    android: {
        package: "app.umn.burrow",
        icon: "./assets/images/burrow.png",
        edgeToEdgeEnabled: true,
        googleServicesFile: process.env.GOOGLE_SERVICES_FILE,
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
                    }
                ],
                category: ["BROWSABLE", "DEFAULT"]
            },
            {
                action: "VIEW",
                data: [
                    {
                        scheme: "burrow",
                        path: "/oauth"
                    },
                    {
                        scheme: "burrow"
                    },
                    {
                        scheme: "app.umn.burrow"
                    }
                ],
                category: ["BROWSABLE", "DEFAULT"]
            }
        ],
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY
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
        ],
        [
            "@react-native-google-signin/google-signin",
            {
                iosUrlScheme:
                    "com.googleusercontent.apps.808386876282-51cc5ue6pkbplbhtbugko3hhhometbq4"
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
        apiUrl: process.env.API_URL,
        cdnUrl: process.env.CDN_URL,
        googleMapsApiKey: {
            ios: process.env.GOOGLE_MAPS_IOS_API_KEY,
            android: process.env.GOOGLE_MAPS_ANDROID_API_KEY
        },
        eas: {
            projectId: "3dc55916-e2a2-4081-a6cd-b76056b7386f"
        }
    }
})
