# GitHub APK Updates

The app checks `update-manifest.json` from the default branch before opening. If the installed Android `versionCode` is lower than `latestVersionCode` or `minimumVersionCode`, the employee cannot enter the app until the APK is updated.

Android does not allow an ordinary app to silently install an APK. The update button opens the GitHub Release APK in the browser. The employee must approve the Android installation, return to Worketa, and press **I have installed it, check again**. On managed company devices, Android device-owner/MDM software can automate that approval.

## Release checklist

1. Create a release keystore once. Never use the debug keystore for releases.
2. Set these Gradle properties locally or in CI: `WORKETA_RELEASE_KEYSTORE_FILE`, `WORKETA_RELEASE_KEYSTORE_PASSWORD`, `WORKETA_RELEASE_KEY_ALIAS`, and `WORKETA_RELEASE_KEY_PASSWORD`.
3. Increase `expo.android.versionCode` and `expo.version` in `app.json`. Also update `CURRENT_VERSION_CODE` in `src/services/appUpdate.ts`.
4. Build the signed APK with `cd android && ./gradlew assembleRelease`.
5. Rename the APK to match the URL in `update-manifest.json`, for example `worketa-employee-v1.2.0.apk`.
6. Create a GitHub Release tag matching the version and upload that APK.
7. Commit and push the updated `update-manifest.json` to the default branch.

Do not publish the manifest before the matching APK exists. Existing users will otherwise be blocked by an update link that cannot be downloaded.