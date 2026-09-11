import 'package:flutter/material.dart';
// ignore: unused_import
import 'package:track_expenses/consts/colors/appcolors.dart';

class Bills extends StatefulWidget {
  const Bills({super.key});

  @override
  State<Bills> createState() => _BillsState();
}

class _BillsState extends State<Bills> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Center(
        child: Text(
          'Bills',
          style: TextStyle(color: theme.colorScheme.onSurface),
        ),
      ),
    );
  }
}
