import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:native_glass_navbar/native_glass_navbar.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
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
  List<Widget> pageIndex = [Homescreen(), Wallet(), Bills(), Settings()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(extendBody: true,
    
    body: pageIndex[selected],
    bottomNavigationBar: NativeGlassNavBar(
      tintColor: Appcolors.black,
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
),
    );
  }
}
