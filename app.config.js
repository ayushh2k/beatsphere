export default {
    expo: {
        name: "Beatsphere",
        slug: "beatsphere",
        version: "1.2.0",
        orientation: "portrait",
        newArchEnabled: true,
        icon: "./assets/images/splashscreen_img.png",
        scheme: "beatsphere",
        userInterfaceStyle: "automatic",
        splash: {
            image: "./assets/images/splashscreen_img.png",
            resizeMode: "contain",
            backgroundColor: "#2a2b2f"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.beatsphere.beatsphere",
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/logo.jpg",
                backgroundColor: "#ffffff"
            },
            permissions: [
                "INTERNET",
                "ACCESS_NETWORK_STATE"
            ],
            newArchEnabled: true,
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            },
            package: "com.beatsphere.beatsphere",
            intentFilters: [
                {
                    action: "VIEW",
                    data: [
                        {
                            scheme: "beatsphere"
                        }
                    ],
                    category: [
                        "BROWSABLE",
                        "DEFAULT"
                    ]
                }
            ]
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            "expo-font",
            "expo-secure-store",
            [
                "expo-build-properties",
                {
                    android: {
                        usesCleartextTraffic: true
                    }
                }
            ],
            [
                "expo-splash-screen",
                {
                    backgroundColor: "#2a2b2f",
                    image: "./assets/images/splashscreen_img.png",
                    resizeMode: "contain"
                }
            ],
            "expo-web-browser",
            [
                "expo-media-library",
                {
                    "photosPermission": "Allow BeatSphere to save your Remapped image to photos.",
                    "savePhotosPermission": "Allow BeatSphere to save your Remapped image to photos."
                }
            ],
            "expo-audio"
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            eas: {
                projectId: "19b8bcb5-af80-4faa-a0a1-aeaa7408abcf"
            }
        },
        owner: "meap"
    }
};
