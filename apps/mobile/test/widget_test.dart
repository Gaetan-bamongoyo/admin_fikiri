// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:fikiri_front/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App logo rendering and navigation smoke test', (
    WidgetTester tester,
  ) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that our SplashPage renders the AppLogo containing the car icon.
    expect(find.byIcon(Icons.directions_car_outlined), findsOneWidget);

    // Advance time by 3 seconds to trigger the navigation timer.
    await tester.pump(const Duration(seconds: 3));

    // Let the navigation transition settle.
    await tester.pumpAndSettle();

    // Verify that we have navigated to the LoginPage
    expect(find.text('Connectez-vous pour continuer'), findsOneWidget);
  });
}
