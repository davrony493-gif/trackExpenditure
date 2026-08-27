import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/OnboardingPage.dart';

class Elevatedbuttononboarding extends StatelessWidget {
  const Elevatedbuttononboarding({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<OnboardingProvider>();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: FadeInUp(
          delay: const Duration(milliseconds: 150),
          duration: const Duration(milliseconds: 350),
          from: 16,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Appcolors.black,
              foregroundColor: Appcolors.white,
              elevation: 0,
              shape: const StadiumBorder(),
            ),
            onPressed: () =>
                context.read<OnboardingProvider>().nextPage(context),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              transitionBuilder: (child, animation) {
                return FadeTransition(
                  opacity: animation,
                  child: ScaleTransition(scale: animation, child: child),
                );
              },
              child: Text(
                state.currentPage == state.data.length - 1
                    ? 'GET STARTED'
                    : 'NEXT',
                key: ValueKey<bool>(state.currentPage == state.data.length - 1),
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
