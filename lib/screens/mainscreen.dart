import 'dart:io';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:native_glass_navbar/native_glass_navbar.dart';
import 'package:track_expenses/screens/bills.dart';
import 'package:track_expenses/screens/homescreen.dart';
import 'package:track_expenses/screens/settings.dart';
import 'package:track_expenses/screens/wallet.dart';

class Mainscreen extends StatefulWidget {
  const Mainscreen({super.key});

  @override
  State<Mainscreen> createState() => _MainscreenState();
}

class _MainscreenState extends State<Mainscreen> {
  int selected = 0;
  final List<Widget> _pages = const [
    Homescreen(),
    Wallet(),
    Bills(),
    Settings(),
  ];

  Widget _buildAndroidNavBar(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 14),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
          child: Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.surface.withOpacity(0.38),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: Colors.white.withOpacity(0.25),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: BottomNavigationBar(
              currentIndex: selected,
              onTap: (index) {
                setState(() {
                  selected = index;
                });
              },
              type: BottomNavigationBarType.fixed,
              backgroundColor: Colors.transparent,
              elevation: 0,
              selectedItemColor: theme.colorScheme.primary,
              unselectedItemColor: theme.colorScheme.onSurface.withOpacity(0.6),
              showUnselectedLabels: true,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home_rounded),
                  label: 'Home',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.account_balance_wallet_outlined),
                  activeIcon: Icon(Icons.account_balance_wallet_rounded),
                  label: 'Wallet',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.receipt_long_outlined),
                  activeIcon: Icon(Icons.receipt_long_rounded),
                  label: 'Bills',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.settings_outlined),
                  activeIcon: Icon(Icons.settings_rounded),
                  label: 'Settings',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIosNavBar(BuildContext context) {
    final theme = Theme.of(context);

    return NativeGlassNavBar(
      tintColor: theme.colorScheme.onSurface,
      currentIndex: selected,
      onTap: (index) {
        setState(() {
          selected = index;
        });
      },
      tabs: const [
        NativeGlassNavBarItem(label: 'Home', symbol: 'house'),
        NativeGlassNavBarItem(label: 'Wallet', symbol: 'wallet.pass'),
        NativeGlassNavBarItem(label: 'Bills', symbol: 'doc.text'),
        NativeGlassNavBarItem(label: 'Settings', symbol: 'gear'),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: _pages[selected],
      bottomNavigationBar: Platform.isAndroid
          ? _buildAndroidNavBar(context)
          : _buildIosNavBar(context),
    );
  }
}
