import 'package:flutter/material.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';

class Bills extends StatefulWidget {
  const Bills({super.key});

  @override
  State<Bills> createState() => _BillsState();
}

class _BillsState extends State<Bills> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Appcolors.white,
      body: Center(child: Text('Bills')),
    );
  }
}