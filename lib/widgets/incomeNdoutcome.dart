import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';

class Incomendoutcome extends StatefulWidget {
  const Incomendoutcome({super.key});

  @override
  State<Incomendoutcome> createState() => _IncomendoutcomeState();
}

class _IncomendoutcomeState extends State<Incomendoutcome> {
  @override
  Widget build(BuildContext context) {
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
                      Icon(Icons.arrow_downward, color: Appcolors.textColor),
                      Text(
                        'INCOME',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Appcolors.textColor,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '+\$4,200.50',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
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
                      Icon(Icons.arrow_upward, color: Appcolors.textColor),
                      Text(
                        'OUTCOME',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Appcolors.textColor,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '-\$1,840.00',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
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
