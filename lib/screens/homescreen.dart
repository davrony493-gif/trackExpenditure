import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/homePage.dart';
import 'package:track_expenses/widgets/animationNdActions.dart';
import 'package:track_expenses/widgets/appbarOfhomescreen.dart';
import 'package:track_expenses/widgets/customDrawer.dart';
import 'package:track_expenses/widgets/incomeNdoutcome.dart';
import 'package:track_expenses/widgets/recentTransactions.dart';

class Homescreen extends StatelessWidget {
  const Homescreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<Homepage>();

    return Scaffold(
      backgroundColor: Appcolors.white,
      drawer: const Customdrawer(),
      appBar: const Appbarofhomescreen(),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              const SizedBox(height: 48),
              FadeInDown(
                delay: const Duration(milliseconds: 100),
                duration: const Duration(milliseconds: 400),
                child: Text(
                  'TOTAL BALANCE',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                    color: Appcolors.textColor,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              FadeInUp(
                delay: const Duration(milliseconds: 200),
                duration: const Duration(milliseconds: 400),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      state.dollar,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 28,
                      ),
                    ),
                    Text(
                      state.money,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 28,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              FadeInUp(
                delay: const Duration(milliseconds: 300),
                duration: const Duration(milliseconds: 400),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ActionButton(label: 'ADD FUNDS', index: 0),
                    SizedBox(width: 12),
                    ActionButton(label: 'SEND', index: 1),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              ZoomIn(
                delay: const Duration(milliseconds: 400),
                duration: const Duration(milliseconds: 400),
                child: Hero(
                  tag: 'icon1',
                  child: IconButton(
                    onPressed: () {
                      state.openExpenses(context);
                    },
                    icon: Icon(Icons.add),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Incomendoutcome(),
              const SizedBox(height: 24),
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                duration: const Duration(milliseconds: 400),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Transactions',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'VIEW ALL',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Appcolors.textColor,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const RecentTransactionsList(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
