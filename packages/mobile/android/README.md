## Setting Up Android Emulator Without Android Studio in macOS

### Step 1: Install Android SDK Command Line Tools
1. Download the Android SDK Command Line Tools from the [Android Developer website](https://developer.android.com/studio#command-line-tools-only)


### Step 2: Setup
1. `mkdir -p ~/Android/cmdline-tools`
2. ```
    cd ~/Downloads
    unzip commandlinetools-*.zip
    ```
3. `mv cmdline-tools ~/Android/cmdline-tools/latest`

### Step 3: Configure environment variables

1. Add the following environment variables to your shell configuration file (.bashrc, .zshrc, or .bash_profile):

```
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```


2.After saving the file, reload your shell configuration:
`source ~/.zshrc  # or ~/.bashrc if you're using bash`

### Step 4: Accept Android SDK Licenses (macOS/Linux)

*macOS / Linux users only*: Before installing SDK components, you must accept the Android SDK licenses:

`yes | sdkmanager --licenses`


### Step 5: Install SDK Components
Use `sdkmanager` to install the required Android SDK components: platform tools, an Android platform, a system image, and the emulator.

For Apple Silicon Macs (M1/M2/M3/M4):

`sdkmanager "platform-tools" "platforms;android-35" "system-images;android-35;google_apis;arm64-v8a" "emulator"`

For Intel-based Macs and Linux:

`sdkmanager "platform-tools" "platforms;android-35" "system-images;android-35;google_apis;x86_64" "emulator"`

### Step 6: Create an Android Virtual Device (AVD)

macOS / Linux (Apple Silicon):

`avdmanager create avd -n myEmu -k "system-images;android-35;google_apis;arm64-v8a" --device "pixel_8"`


macOS / Linux (Intel-based):

`avdmanager create avd -n myEmu -k "system-images;android-35;google_apis;x86_64" --device "pixel_8"`


### Step 7: Start the Emulator
Launch your emulator using the AVD name you created:

`emulator -avd myEmu -gpu host`


### Step 8: Additional Tools and Commands

**List All AVDs:**
View all created virtual devices:

`avdmanager list avd`

**List Connected Devices**:
Use ADB (Android Debug Bridge) to view all connected Android devices and running emulators:

`adb devices`

This is useful for verifying that your emulator is running and properly connected.

**Install an APK**:
Install an Android application package (APK) to your emulator or connected device:

`adb install myApp.apk`

Replace myApp.apk with the path to your APK file.

### How to Enable Fast Refresh in React Native
React Native uses a hot reload system called Fast Refresh.
It is enabled by default in development mode, but you can manually enable or disable it via the Developer Menu.

To open the Developer Menu on Android emulator:
`adb shell input keyevent 82`

This command simulates the hardware menu button and opens the Developer Menu inside the emulator.

**From the Developer Menu**:

* Look for the option: Enable Fast Refresh
* If it's unchecked, tap to enable it
* If it's already checked, Fast Refresh is already active

**Alternative (if adb doesn't work)**:

Focus the emulator window and press:

* Ctrl + M (Windows/Linux)
* Cmd + M (Mac)
