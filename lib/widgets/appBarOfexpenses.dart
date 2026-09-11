// ignore_for_file: unused_import

import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/expenditurePage.dart';

class Appbarofexpenses extends StatelessWidget implements PreferredSizeWidget {
  const Appbarofexpenses({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AppBar(
      scrolledUnderElevation: 0.0,
      backgroundColor: theme.scaffoldBackgroundColor,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          SlideInLeft(
            duration: const Duration(milliseconds: 400),
            child: Hero(
              tag: 'icon1',
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close, color: theme.colorScheme.onSurface),
                splashRadius: 20,
                tooltip: 'Close',
              ),
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
                color: theme.colorScheme.onSurface,
              ),
            ),
          ),
          SlideInRight(
            duration: const Duration(milliseconds: 400),
            child: TextButton(
              onPressed: () {
                context.read<Expenditurepage>().sendIncome(context);
              },
              style: TextButton.styleFrom(
                foregroundColor: theme.colorScheme.onSurface,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
              child: Text(
                'SAVE',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
