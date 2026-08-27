import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/providers/OnboardingPage.dart';

class PageviewOnboarding extends StatelessWidget {
  const PageviewOnboarding({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<OnboardingProvider>();

    return Expanded(
      child: PageView.builder(
        controller: state.pageController,
        itemCount: state.data.length,
        onPageChanged: (index) {
          context.read<OnboardingProvider>().onPageChanged(index);
        },
        itemBuilder: (context, index) {
          final item = state.data[index];
          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FadeIn(
                delay: const Duration(milliseconds: 100),
                duration: const Duration(milliseconds: 400),
                child: ZoomInDown(
                  duration: const Duration(milliseconds: 400),
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Appcolors.iconColor,
                    ),
                    child: Center(
                      child: SvgPicture.asset(
                        Assets.icons.statistics,
                        width: 28,
                        height: 28,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              FadeIn(
                delay: const Duration(milliseconds: 250),
                duration: const Duration(milliseconds: 400),
                child: ZoomInDown(
                  duration: const Duration(milliseconds: 400),
                  child: Text(
                    item["title"]!,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w700,
                      fontSize: 24,
                      color: Colors.black,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: FadeIn(
                  delay: const Duration(milliseconds: 400),
                  duration: const Duration(milliseconds: 400),
                  child: ZoomInDown(
                    duration: const Duration(milliseconds: 400),
                    child: Text(
                      item["description"]!,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w400,
                        fontSize: 15,
                        color: Appcolors.textColor,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}