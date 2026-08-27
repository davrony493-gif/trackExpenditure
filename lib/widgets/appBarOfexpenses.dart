import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/providers/expenditurePage.dart'; // Corrected capitalization

class Appbarofexpenses extends StatelessWidget implements PreferredSizeWidget {
  const Appbarofexpenses({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      scrolledUnderElevation: 0.0,
      backgroundColor: Appcolors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: SlideInLeft(
              duration: const Duration(milliseconds: 400),
              child: SvgPicture.asset(Assets.icons.cancel),
            ),
          ),
          SlideInDown(
            duration: const Duration(milliseconds: 400),
            child: Text(
              'New Entry',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w700,
                fontSize: 22,
                color: Appcolors.black,
              ),
            ),
          ),
          GestureDetector(
            onTap: () => context.read<Expenditurepage>().saveEntry(context),
            child: SlideInRight(
              duration: const Duration(milliseconds: 400),
              child: SvgPicture.asset(Assets.icons.save),
            ),
          ),
        ],
      ),
    );
  }
}