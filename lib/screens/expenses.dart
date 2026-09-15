import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/providers/expenditurePage.dart';
import 'package:track_expenses/widgets/appBarOfexpenses.dart';
import 'package:open_file/open_file.dart';
import 'package:path/path.dart' as path;

class Expenses extends StatelessWidget {
  const Expenses({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<Expenditurepage>();
    final state2 = context.read<Expenditurepage>();
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () {
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: const Appbarofexpenses(),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                Center(
                  child: FadeInDown(
                    delay: const Duration(milliseconds: 100),
                    duration: const Duration(milliseconds: 400),
                    child: Text(
                      'AMOUNT',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.7,
                        ),
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // Interactive Amount Field (Dotted Default -> Editable TextField)
                const Center(child: InteractiveAmountInput()),

                const SizedBox(height: 32),
                Center(
                  child: FadeInUp(
                    delay: const Duration(milliseconds: 300),
                    duration: const Duration(milliseconds: 400),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(28),
                        color: theme.colorScheme.surfaceContainerHighest,
                      ),
                      child: IntrinsicWidth(
                        child: Stack(
                          children: [
                            AnimatedAlign(
                              duration: const Duration(milliseconds: 250),
                              curve: Curves.easeInOutCubic,
                              alignment: state.isExpense
                                  ? Alignment.centerLeft
                                  : Alignment.centerRight,
                              child: FractionallySizedBox(
                                widthFactor: 0.5,
                                child: Container(
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.primary,
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                ),
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildToggleTab(
                                  label: 'EXPENSE',
                                  isSelected: state.isExpense,
                                  onTap: () => context
                                      .read<Expenditurepage>()
                                      .toggleExpenseType(true),
                                ),
                                _buildToggleTab(
                                  label: 'INCOME',
                                  isSelected: !state.isExpense,
                                  onTap: () => context
                                      .read<Expenditurepage>()
                                      .toggleExpenseType(false),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: FadeInUp(
                    delay: const Duration(milliseconds: 350),
                    duration: const Duration(milliseconds: 400),
                    child: TextButton(
                      style: TextButton.styleFrom(
                        overlayColor: theme.colorScheme.primary,
                      ),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            backgroundColor:
                                theme.dialogTheme.backgroundColor ??
                                theme.cardColor,
                            title: Text(
                              'Insert image from ?',
                              style: TextStyle(
                                fontFamily: 'Inter',
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                            content: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  spacing: 20,
                                  children: [
                                    TextButton(
                                      style: TextButton.styleFrom(
                                        overlayColor: Appcolors.black,
                                      ),
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                        state.pickFileFromFolder(
                                          context: context,
                                        );
                                      },
                                      child: Text(
                                        'File',
                                        style: TextStyle(
                                          color: theme.colorScheme.onSurface,
                                          fontFamily: 'Inter',
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      style: TextButton.styleFrom(
                                        overlayColor: Appcolors.black,
                                      ),
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                        state.pickImageFromCamera();
                                      },
                                      child: Text(
                                        'Camera',
                                        style: TextStyle(
                                          color: theme.colorScheme.onSurface,
                                          fontFamily: 'Inter',
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      style: TextButton.styleFrom(
                                        overlayColor: Appcolors.black,
                                      ),
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                        state2.pickImageFromGallery();
                                      },
                                      child: Text(
                                        'Gallery',
                                        style: TextStyle(
                                          color: theme.colorScheme.onSurface,
                                          fontFamily: 'Inter',
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                TextButton(
                                  style: TextButton.styleFrom(
                                    overlayColor: Appcolors.black,
                                  ),
                                  onPressed: () {
                                    // state.pickImageFromCamera();
                                    Navigator.pop(context);
                                  },
                                  child: Text(
                                    'Cancel',
                                    style: TextStyle(
                                      color: theme.colorScheme.onSurface,
                                      fontFamily: 'Inter',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      child: Text(
                        'Insert Image',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                state.rasm != null
                    ? InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () {
                          OpenFile.open(state.rasm!.path);
                        },
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Text(
                              path.basename(state.rasm!.path),
                              style: TextStyle(
                                fontFamily: 'Inter',
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                          ),
                        ),
                      )
                    : const SizedBox(),

                SizedBox(height: 15),
                FadeInUp(
                  delay: const Duration(milliseconds: 400),
                  duration: const Duration(milliseconds: 400),
                  child: Text(
                    'CATEGORY',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                FadeInUp(
                  delay: const Duration(milliseconds: 440),
                  duration: const Duration(milliseconds: 400),
                  child: Divider(
                    height: 1,
                    thickness: 1,
                    color: Appcolors.contaienrColor,
                  ),
                ),
                const SizedBox(height: 16),

                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.iconPaths.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 12,
                    mainAxisExtent: 85,
                  ),
                  itemBuilder: (context, index) {
                    final isSelected = state.selectedCategoryIndex == index;

                    return FadeInUp(
                      delay: Duration(milliseconds: 480 + (index * 50)),
                      duration: const Duration(milliseconds: 400),
                      child: GestureDetector(
                        onTap: () => context
                            .read<Expenditurepage>()
                            .selectCategory(index),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            AnimatedScale(
                              scale: isSelected ? 1.08 : 1.0,
                              duration: const Duration(milliseconds: 200),
                              curve: Curves.easeOutBack,
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                curve: Curves.easeInOut,
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isSelected
                                      ? Appcolors.black
                                      : Appcolors.contaienrColor,
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: SvgPicture.asset(
                                    state.iconPaths[index],
                                    colorFilter: ColorFilter.mode(
                                      isSelected
                                          ? Appcolors.white
                                          : Appcolors.darkGrey,
                                      BlendMode.srcIn,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 200),
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.6,
                                color: isSelected
                                    ? Appcolors.black
                                    : Appcolors.grey,
                              ),
                              child: Text(state.texts[index]),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),

                FadeInUp(
                  delay: const Duration(milliseconds: 800),
                  duration: const Duration(milliseconds: 400),
                  child: TextField(
                    controller: state.notesController,
                    onChanged: (_) =>
                        context.read<Expenditurepage>().clearNoteError(),
                    decoration: InputDecoration(
                      hintText: 'ADD NOTES',
                      errorText: state.noteErrorText,
                      hintStyle: TextStyle(
                        color: Appcolors.textColor,
                        fontSize: 14,
                      ),
                      focusedBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Appcolors.black),
                      ),
                      enabledBorder: UnderlineInputBorder(
                        borderSide: BorderSide(color: Appcolors.contaienrColor),
                      ),
                      errorBorder: const UnderlineInputBorder(
                        borderSide: BorderSide(color: Colors.redAccent),
                      ),
                      focusedErrorBorder: const UnderlineInputBorder(
                        borderSide: BorderSide(
                          color: Colors.redAccent,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 120),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildToggleTab({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 40,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 32.5),
        child: AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 200),
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w600,
            fontSize: 12,
            color: isSelected ? Appcolors.white : Appcolors.textColor,
          ),
          child: Text(label),
        ),
      ),
    );
  }
}

//* ---------------------------------------------------------------------------
//* Interactive Amount Input Widget
//* ---------------------------------------------------------------------------
class InteractiveAmountInput extends StatefulWidget {
  const InteractiveAmountInput({super.key});

  @override
  State<InteractiveAmountInput> createState() => _InteractiveAmountInputState();
}

class _InteractiveAmountInputState extends State<InteractiveAmountInput> {
  bool _isEditing = false;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus) {
        setState(() {
          _isEditing = !_isEditing;
        });
      }
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  void _startEditing() {
    final provider = context.read<Expenditurepage>();

    if (provider.amountController.text == '0.00') {
      provider.amountController.clear();
      provider.updateAmount('');
    }

    setState(() {
      _isEditing = true;
    });
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<Expenditurepage>();

    return FadeInUp(
      delay: const Duration(milliseconds: 200),
      duration: const Duration(milliseconds: 400),
      child: GestureDetector(
        onTap: _startEditing,
        behavior: HitTestBehavior.opaque,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Transform.translate(
              offset: const Offset(0, -8),
              child: Text(
                state.currencySymbol,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Appcolors.black,
                ),
              ),
            ),
            const SizedBox(width: 6),
            if (_isEditing)
              IntrinsicWidth(
                child: TextField(
                  cursorColor: Appcolors.black,
                  cursorHeight: 32,
                  controller: state.amountController,
                  focusNode: _focusNode,
                  autofocus: true,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: (val) =>
                      context.read<Expenditurepage>().updateAmount(val),
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 48,
                    fontWeight: FontWeight.w700,
                    color: Appcolors.black,
                  ),
                  decoration: const InputDecoration(
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                  ),
                ),
              )
            else
              _buildDottedAmount(
                state.amount.isEmpty ? '0.00' : state.amount,
                fontSize: 48,
                color: Appcolors.black,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDottedAmount(
    String amountStr, {
    required double fontSize,
    required Color color,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: amountStr.split('').map((char) {
        if (char == '0') {
          return Stack(
            alignment: Alignment.center,
            children: [
              Text(
                '0',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: fontSize,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
              Transform.translate(
                offset: Offset(0, -fontSize * 0.03),
                child: Container(
                  width: fontSize * 0.11,
                  height: fontSize * 0.11,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          );
        }
        return Text(
          char,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: fontSize,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        );
      }).toList(),
    );
  }
}
