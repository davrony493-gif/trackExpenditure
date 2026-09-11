import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';

class Appbarofhomescreen extends StatefulWidget implements PreferredSizeWidget {
  const Appbarofhomescreen({super.key});

  @override
  State<Appbarofhomescreen> createState() => _AppbarofhomescreenState();

  @override
  Size get preferredSize => Size(double.infinity, 50);
}

class _AppbarofhomescreenState extends State<Appbarofhomescreen> {
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
            onTap: () => Scaffold.of(context).openDrawer(),
            child: FadeInLeft(
              duration: const Duration(milliseconds: 400),
              child: SvgPicture.asset(Assets.icons.menu),
            ),
          ),
          FadeInDown(
            duration: const Duration(milliseconds: 400),
            child: Text(
              'Overview',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w700,
                fontSize: 22,
                color: Appcolors.black,
              ),
            ),
          ),
          FadeInRight(
            duration: const Duration(milliseconds: 400),
            child: SvgPicture.asset(Assets.icons.profile),
          ),
        ],
      ),
    );
  }
}
