import 'package:adaptive_theme/adaptive_theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/themes/appthemes.dart';
import 'package:track_expenses/providers/OnboardingPage.dart';
// Expenditurepage is provided per-route; don't register globally here.
import 'package:track_expenses/providers/homepage.dart';
import 'package:track_expenses/providers/signin_provider.dart';
import 'package:track_expenses/screens/onboarding.dart';

void main(List<String> args) {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => OnboardingProvider()),
        ChangeNotifierProvider(create: (_) => SigninProvider()),
        ChangeNotifierProvider(create: (_) => Homepage()),
        // Expenditurepage should be created per Expenses route so each entry gets a fresh instance.
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AdaptiveTheme(
      light: Appthemes.light,
      initial: AdaptiveThemeMode.system,
      dark: Appthemes.dark,
      builder: (ThemeData light, ThemeData dark) => const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Onboarding(),
      ),
    );
  }
}
