import 'package:flutter/material.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';

class Wallet extends StatefulWidget {
  const Wallet({super.key});

  @override
  State<Wallet> createState() => _WalletState();
}

class _WalletState extends State<Wallet> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Appcolors.white,
      body: Center(child: Text('Wallet')),
    );
  }
}