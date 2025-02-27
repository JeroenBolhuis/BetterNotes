# Building an APK for Testing

This guide will help you build an APK file for testing your BetterNotes app on Android devices.

## Prerequisites

1. Make sure you have the following installed:
   - Node.js and npm
   - Java Development Kit (JDK) 11 or newer
   - Android Studio with Android SDK

2. Set up environment variables:
   - ANDROID_HOME pointing to your Android SDK location
   - JAVA_HOME pointing to your JDK installation

## Building with Expo

Since this project is built with Expo, we'll use EAS Build to create the APK.

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Log in to your Expo account

```bash
eas login
```

If you don't have an Expo account, you can create one at [expo.dev](https://expo.dev/signup).

### 3. Configure EAS Build

Create an `eas.json` file in the root of your project:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### 4. Start the build process

For a development build:

```bash
eas build --platform android --profile development
```

For a preview build (recommended for testing):

```bash
eas build --platform android --profile preview
```

### 5. Download and install the APK

Once the build is complete, EAS will provide a URL where you can download the APK. You can:

- Download it directly on your Android device
- Download it to your computer and transfer it to your device
- Scan the QR code provided by EAS to download it directly

### 6. Install on your Android device

1. Make sure your device allows installation from unknown sources
   - Go to Settings > Security > Unknown sources (or Settings > Apps > Special access > Install unknown apps)
   
2. Open the APK file on your device to install it

## Building Locally (Alternative Method)

If you prefer to build locally without using EAS:

### 1. Install the Expo Development Client

```bash
expo install expo-dev-client
```

### 2. Generate native Android project files

```bash
expo prebuild --platform android
```

### 3. Build the APK using Gradle

```bash
cd android
./gradlew assembleDebug
```

The APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`

## Troubleshooting

- If you encounter any issues with the build, check the Expo documentation at [docs.expo.dev](https://docs.expo.dev/build/setup/)
- Make sure all dependencies are compatible with the Expo SDK version you're using
- For local builds, ensure your Android SDK is properly configured

## Notes

- The APK built with these methods will be larger than a production build because it includes development tools
- For a production-ready APK, use `eas build --platform android --profile production` 