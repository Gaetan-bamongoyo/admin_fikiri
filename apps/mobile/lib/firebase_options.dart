import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Options Firebase générées depuis `android/app/google-services.json`.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Firebase non configuré pour le web.');
    }

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => android,
      TargetPlatform.iOS => ios,
      _ => throw UnsupportedError(
        'Firebase non configuré pour $defaultTargetPlatform.',
      ),
    };
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDIae_xBZfdmXFCzYEOiCcOPnXe9H_P38Y',
    appId: '1:359736129628:android:66507121e47b147cf5ce99',
    messagingSenderId: '359736129628',
    projectId: 'fikiri-traffic',
    storageBucket: 'fikiri-traffic.firebasestorage.app',
  );

  /// À compléter via `flutterfire configure` si build iOS requis.
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDIae_xBZfdmXFCzYEOiCcOPnXe9H_P38Y',
    appId: '1:359736129628:ios:placeholder',
    messagingSenderId: '359736129628',
    projectId: 'fikiri-traffic',
    storageBucket: 'fikiri-traffic.firebasestorage.app',
    iosBundleId: 'com.example.fikiriFront',
  );
}
