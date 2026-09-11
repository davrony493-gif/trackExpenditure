import 'dart:io';
import 'dart:ui';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/models/expense_Model.dart';
import 'package:track_expenses/providers/homePage.dart';

class ItemWidget extends StatelessWidget {
  const ItemWidget({super.key, required this.expenseModel});

  final ExpenseModel expenseModel;

  String _getCategoryIcon(ExpenseCategory category) {
    switch (category) {
      case ExpenseCategory.home:
        return Assets.icons.home;
      case ExpenseCategory.food:
        return Assets.icons.fork;
      case ExpenseCategory.transit:
        return Assets.icons.blackcar;
      case ExpenseCategory.shop:
        return Assets.icons.shoppingbag2;
      case ExpenseCategory.bills:
        return Assets.icons.blacklighting;
      case ExpenseCategory.more:
        return Assets.icons.more;
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'Today';
    if (date is DateTime) {
      return DateFormat.yMMMMd().format(date);
    }
    if (date is String) {
      final parsed = DateTime.tryParse(date);
      return parsed != null ? DateFormat.yMMMMd().format(parsed) : date;
    }
    return date.toString();
  }

  void _openImagePreview(BuildContext context, String heroTag, File imageFile) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierDismissible: true,
        barrierColor: Colors.black.withValues(alpha: 0.3),
        pageBuilder: (context, animation, secondaryAnimation) {
          return FadeTransition(
            opacity: animation,
            child: Scaffold(
              backgroundColor: Colors.transparent,
              body: Stack(
                fit: StackFit.expand,
                children: [
                  // Blurred Backdrop
                  BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 18.0, sigmaY: 18.0),
                    child: GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                  // Expanded Hero Image
                  Center(
                    child: Hero(
                      tag: heroTag,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.sizeOf(context).width * 0.85,
                            maxHeight: MediaQuery.sizeOf(context).height * 0.65,
                          ),
                          child: Image.file(
                            imageFile,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Close Button
                  Positioned(
                    top: MediaQuery.paddingOf(context).top + 16,
                    right: 20,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 28),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isIncome = expenseModel.isIncome;
    final theme = Theme.of(context);
    final heroTag = 'expense_image_${expenseModel.id ?? expenseModel.hashCode}';

    final content = Material(
      color: Colors.transparent,
      child: SizedBox(
        width: MediaQuery.sizeOf(context).width - 32,
        child: Card(
          elevation: 0,
          margin: EdgeInsets.zero,
          color: theme.colorScheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: theme.dividerColor.withValues(alpha: 0.08),
              width: 1,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (expenseModel.image != null &&
                      expenseModel.image!.trim().isNotEmpty &&
                      File(expenseModel.image!).existsSync())
                    GestureDetector(
                      onTap: () => _openImagePreview(
                        context,
                        heroTag,
                        File(expenseModel.image!),
                      ),
                      child: Hero(
                        tag: heroTag,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            File(expenseModel.image!),
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    )
                  else
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        shape: BoxShape.circle,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: SvgPicture.asset(
                          _getCategoryIcon(expenseModel.type),
                          colorFilter: ColorFilter.mode(
                            theme.colorScheme.onSurface,
                            BlendMode.srcIn,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              title: Text(
                (expenseModel.note != null &&
                        expenseModel.note!.trim().isNotEmpty)
                    ? expenseModel.note!
                    : expenseModel.type.name.toUpperCase(),
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${expenseModel.type.name.toUpperCase()} ',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                  Text(
                    '${_formatDate(expenseModel.createdAt)} ',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
              trailing: Text(
                '${isIncome ? "+" : "-"}\$${expenseModel.value.toStringAsFixed(2)}',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w500,
                  fontSize: 16,
                  color: isIncome
                      ? Appcolors.green
                      : theme.colorScheme.onSurface,
                ),
              ),
            ),
          ),
        ),
      ),
    );

    return CupertinoContextMenu(
      actions: [
        CupertinoContextMenuAction(
          onPressed: () {
            Navigator.pop(context);
          },
          trailingIcon: CupertinoIcons.eye,
          child: const Text('View details'),
        ),
        CupertinoContextMenuAction(
          isDestructiveAction: true,
          onPressed: () {
            final id = expenseModel.id;
            Navigator.pop(context);
            if (id != null) {
              context.read<Homepage>().deleteExpenseById(
                id: id,
                onSuccess: () {},
              );
            }
          },
          trailingIcon: CupertinoIcons.delete,
          child: const Text('Delete'),
        ),
      ],
      child: content,
    );
  }
}