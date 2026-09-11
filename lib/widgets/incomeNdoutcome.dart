// ignore_for_file: deprecated_member_use

// ignore: unused_import
import 'dart:math';

import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
// ignore: unused_import
import 'package:track_expenses/models/expense_Model.dart';
import 'package:track_expenses/providers/homePage.dart';

class Incomendoutcome extends StatefulWidget {
  const Incomendoutcome({super.key});

  //! Try to find the location of the logic of money !
  @override
  State<Incomendoutcome> createState() => _IncomendoutcomeState();
}

class _IncomendoutcomeState extends State<Incomendoutcome> {
  @override
  Widget build(BuildContext context) {
    final state = context.watch<Homepage>();
    final theme = Theme.of(context);

    return FadeInUp(
      delay: const Duration(milliseconds: 500),
      duration: const Duration(milliseconds: 400),
      child: Row(
        spacing: 80,
        children: [
          Row(
            spacing: 16,
            children: [
              Container(
                height: 38,
                width: 4,
                decoration: BoxDecoration(color: Appcolors.green),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.arrow_downward,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                      Text(
                        'INCOME',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurface.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    state.totalIncome,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Row(
            spacing: 16,
            children: [
              Container(
                height: 38,
                width: 4,
                decoration: BoxDecoration(color: Appcolors.red),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.arrow_upward,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                      Text(
                        'OUTCOME',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurface.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    state.totalOutcome,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
