import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/homePage.dart';

class ActionButton extends StatelessWidget {
  final String label;
  final int index;

  const ActionButton({
    super.key,
    required this.label,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final state = context.watch<Homepage>();
    final isSelected = state.selectedActionIndex == index;

    return GestureDetector(
      onTap: () => context.read<Homepage>().selectActionIndex(index),
      child: AnimatedScale(
        scale: isSelected ? 1.04 : 1.0,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutBack,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? Appcolors.black : Appcolors.contaienrColor,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: isSelected ? Colors.transparent : Appcolors.grey,
            ),
          ),
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 200),
            style: TextStyle(
              fontFamily: 'Inter',
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w700,
              fontSize: 12,
              letterSpacing: isSelected ? 0.6 : 0.8,
              color: isSelected ? Appcolors.white : Appcolors.black,
            ),
            child: Text(label),
          ),
        ),
      ),
    );
  }
}