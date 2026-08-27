import 'package:flutter/material.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';

class Settings extends StatefulWidget {
  const Settings({super.key});

  @override
  State<Settings> createState() => _SettingsState();
}

class _SettingsState extends State<Settings> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Appcolors.white,
      body: Center(child: Text('Settings')),
    );
  }
}