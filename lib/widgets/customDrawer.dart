import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// ignore: unused_import
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/homePage.dart';
import 'package:track_expenses/utils/sizeExtension.dart';

class Customdrawer extends StatelessWidget {
  const Customdrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.read<Homepage>();
    final theme = Theme.of(context);

    return Container(
      width: context.width * 0.5,
      height: context.height,
      color: theme.scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(
          children: [
            ListTile(
              title: const Text('CLEAR cash'),
              trailing: IconButton(
                onPressed: () {
                  showCupertinoDialog(
                    context: context,
                    builder: (context) => CupertinoAlertDialog(
                      title: const Text('Confirm to clear the cash'),
                      actions: [
                        CupertinoActionSheetAction(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          child: Text(
                            'Cancel',
                            style: TextStyle(
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                        ),
                        CupertinoActionSheetAction(
                          onPressed: () {
                            Navigator.pop(context);
                            state.clearAllExpenses();
                          },
                          child: Text(
                            'Confirm',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                icon: const Icon(CupertinoIcons.delete),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
