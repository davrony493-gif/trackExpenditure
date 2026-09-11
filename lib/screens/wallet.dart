import 'package:flutter/material.dart';
// ignore: unused_import
import 'package:track_expenses/consts/colors/appcolors.dart';

class Wallet extends StatefulWidget {
  const Wallet({super.key});

  @override
  State<Wallet> createState() => _WalletState();
}

class _WalletState extends State<Wallet> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Center(
        child: Text(
          'Wallet',
          style: TextStyle(color: theme.colorScheme.onSurface),
        ),
      ),
    );
  }
}
