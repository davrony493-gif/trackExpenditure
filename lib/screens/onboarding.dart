import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// ignore: unused_import
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/OnboardingPage.dart';
import 'package:track_expenses/service/permission_service.dart';
import 'package:track_expenses/widgets/elevatedButtonOnboarding.dart';
import 'package:track_expenses/widgets/pageview_onboarding.dart'; // Adjust path

class Onboarding extends StatefulWidget {
  const Onboarding({super.key});

  @override
  State<Onboarding> createState() => _OnboardingState();
}

class _OnboardingState extends State<Onboarding> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await Permisionservice.requestPermissionsInOrder();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<OnboardingProvider>();
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
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
                        icon: Icon(
                          Icons.arrow_back_ios_new,
                          size: 20,
                          color: theme.colorScheme.onSurface,
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
                  children: List.generate(state.data.length, (index) {
                    final isSelected = index == state.currentPage;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: isSelected ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? theme.colorScheme.primary
                            : theme.colorScheme.onSurface.withValues(
                                alpha: 0.3,
                              ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
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
