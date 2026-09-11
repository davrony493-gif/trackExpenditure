import 'package:flutter/material.dart';
// ignore: unused_import
import 'package:track_expenses/consts/colors/appcolors.dart';

class Settings extends StatefulWidget {
  const Settings({super.key});

  @override
  State<Settings> createState() => _SettingsState();
}

class _SettingsState extends State<Settings> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Center(
        child: Text(
          'Settings',
          style: TextStyle(color: theme.colorScheme.onSurface),
        ),
      ),
    );
  }
}
