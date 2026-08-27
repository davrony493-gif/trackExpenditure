import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/OnboardingPage.dart';
import 'package:track_expenses/widgets/elevatedButtonOnboarding.dart';
import 'package:track_expenses/widgets/pageview_onboarding.dart'; // Adjust path

class Onboarding extends StatelessWidget {
  const Onboarding({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<OnboardingProvider>();

    return Scaffold(
      backgroundColor: Appcolors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 300),
                  opacity: state.currentPage != 0 ? 1.0 : 0.0,
                  child: AnimatedScale(
                    duration: const Duration(milliseconds: 300),
                    scale: state.currentPage != 0 ? 1.0 : 0.6,
                    child: IgnorePointer(
                      ignoring: state.currentPage == 0,
                      child: IconButton(
                        onPressed: () =>
                            context.read<OnboardingProvider>().onBackPressed(),
                        icon: const Icon(
                          Icons.arrow_back_ios_new,
                          size: 20,
                          color: Colors.black,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const PageviewOnboarding(),
              FadeInUp(
                delay: const Duration(milliseconds: 100),
                duration: const Duration(milliseconds: 350),
                from: 12,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    state.data.length,
                    (index) {
                      final isSelected = index == state.currentPage;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: isSelected ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isSelected ? Appcolors.black : Appcolors.grey,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Elevatedbuttononboarding(),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}