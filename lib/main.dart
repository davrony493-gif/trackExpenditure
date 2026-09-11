import 'package:adaptive_theme/adaptive_theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/themes/appthemes.dart';
import 'package:track_expenses/providers/OnboardingPage.dart';
import 'package:track_expenses/providers/expenditurePage.dart';
// Expenditurepage is provided per-route; don't register globally here.
import 'package:track_expenses/providers/homePage.dart';
import 'package:track_expenses/providers/signin_provider.dart';
import 'package:track_expenses/screens/expenses.dart';
import 'package:track_expenses/screens/homescreen.dart';
import 'package:track_expenses/screens/mainscreen.dart';
import 'package:track_expenses/screens/onboarding.dart';
import 'package:track_expenses/screens/splashScreen.dart';
import 'package:track_expenses/service/databaseService.dart';
import 'package:track_expenses/widgets/incomeNdoutcome.dart';

void main(List<String> args) async {
  //!The widget is very important as it plays a role of translator !
  WidgetsFlutterBinding.ensureInitialized();
  //Category76 expenseCategory = Category76.bills;
  //!The widget is very important also cuz without it doesnt operate !
  await Databaseservice.init('expenses');
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => Homepage()..getExpensefromDb()),
        ChangeNotifierProvider(create: (_) => OnboardingProvider()),
        ChangeNotifierProvider(create: (_) => SigninProvider()),
        ChangeNotifierProvider(create: (_) => Expenditurepage()),
        // ChangeNotifierProvider(create: (_)=> Incomendoutcome() )
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
      dark: Appthemes.dark,
      initial: AdaptiveThemeMode.system,
      builder: (light, dark) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: light,
        darkTheme: dark,
        themeMode: ThemeMode.system,
        home: const Onboarding(),
      ),
    );
  }
}
