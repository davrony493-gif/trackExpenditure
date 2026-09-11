import 'package:flutter/material.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';

class Appthemes {
  static final ThemeData light = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: Appcolors.white,
    colorScheme: ColorScheme.light(
      primary: Appcolors.black,
      secondary: Appcolors.darkGrey,
      surface: Appcolors.white,
      onSurface: Appcolors.black,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Appcolors.white,
      foregroundColor: Appcolors.black,
      surfaceTintColor: Colors.transparent,
    ),
    textTheme: Typography.blackCupertino,
  );

  static final ThemeData dark = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: Appcolors.black,
    colorScheme: ColorScheme.dark(
      primary: Appcolors.white,
      secondary: Appcolors.lightGrey,
      surface: Appcolors.black,
      onSurface: Appcolors.white,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Appcolors.black,
      foregroundColor: Appcolors.white,
      surfaceTintColor: Colors.transparent,
    ),
    textTheme: Typography.whiteCupertino,
  );
}
