import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/homepage.dart';

class RecentTransactionsList extends StatelessWidget {
  const RecentTransactionsList({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<Homepage>();

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: state.sozlar.length,
      separatorBuilder: (context, index) => FadeInUp(
        delay: Duration(milliseconds: 690 + (index * 80)),
        duration: const Duration(milliseconds: 400),
        child: Divider(
          height: 1,
          thickness: 1,
          indent: 64,
          color: Appcolors.contaienrColor,
        ),
      ),
      itemBuilder: (context, index) {
        final item = state.sozlar[index];
        final bool isIncome = item['isIncome'];

        return FadeInUp(
          delay: Duration(milliseconds: 650 + (index * 80)),
          duration: const Duration(milliseconds: 400),
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Appcolors.contaienrColor,
                shape: BoxShape.circle,
              ),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: SvgPicture.asset(
                  item['icon'],
                  colorFilter: ColorFilter.mode(
                    Appcolors.black,
                    BlendMode.srcIn,
                  ),
                ),
              ),
            ),
            title: Text(
              item['title'],
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w600,
                fontSize: 16,
                color: Appcolors.black,
              ),
            ),
            subtitle: Text(
              item['subtitle'],
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 13,
                color: Appcolors.textColor,
              ),
            ),
            trailing: Text(
              item['amount'],
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w500,
                fontSize: 16,
                color: isIncome ? Appcolors.green : Appcolors.black,
              ),
            ),
          ),
        );
      },
    );
  }
}