import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/providers/homePage.dart';
import 'package:track_expenses/widgets/listViewbuilderHome.dart';

class RecentTransactionsList extends StatelessWidget {
  const RecentTransactionsList({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<Homepage>();

    if (state.expenses.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 28.0),
        child: Center(
          child: FadeInUp(
            delay: const Duration(milliseconds: 650),
            duration: const Duration(milliseconds: 400),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Lottie.asset(
                  Assets.lotties.nodata,
                  width: 170,
                  height: 170,
                  repeat: true,
                  animate: true,
                ),
                const SizedBox(height: 8),
                Text(
                  'No transactions yet',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 14,
                    color: Appcolors.textColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: state.expenses.length,
      itemBuilder: (context, index) {
        final expense = state.expenses[index];

        // Header enters at 600ms; items chain sequentially from 680ms
        // Stagger is capped after index 4 so long lists don't take forever
        final itemDelay = 680 + (index < 5 ? index * 60 : 300);

        return FadeInUp(
          delay: Duration(milliseconds: itemDelay),
          duration: const Duration(milliseconds: 400),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: ItemWidget(expenseModel: expense),
          ),
        );
      },
    );
  }
}