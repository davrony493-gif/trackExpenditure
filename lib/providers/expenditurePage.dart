import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/screens/mainscreen.dart';

class Expenditurepage extends ChangeNotifier {
  final List<String> iconPaths = [
    Assets.icons.home,
    Assets.icons.fork,
    Assets.icons.blackcar,
    Assets.icons.shoppingbag2,
    Assets.icons.blacklighting,
    Assets.icons.more,
  ];

  final List<String> texts = [
    'HOME',
    'FOOD',
    'TRANSIT',
    'SHOP',
    'BILLS',
    'MORE',
  ];

  String amount = '0.00';
  final String currencySymbol = '\$';

  bool _isExpense = true;
  bool get isExpense => _isExpense;

  int _selectedCategoryIndex = 0;
  int get selectedCategoryIndex => _selectedCategoryIndex;

  final TextEditingController notesController = TextEditingController();

  String? _noteErrorText;
  String? get noteErrorText => _noteErrorText;

  void toggleExpenseType(bool isExpense) {
    _isExpense = isExpense;
    notifyListeners();
  }

  void selectCategory(int index) {
    _selectedCategoryIndex = index;
    notifyListeners();
  }

  void clearNoteError() {
    if (_noteErrorText != null) {
      _noteErrorText = null;
      notifyListeners();
    }
  }

  void saveEntry(BuildContext context) {
    FocusScope.of(context).unfocus();

    if (notesController.text.trim().isEmpty) {
      _noteErrorText = 'Please add a note before saving';
      notifyListeners();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add a note before saving!'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      _noteErrorText = null;
      notifyListeners();
      _showSuccessDialog(context);
    }
  }

  void _showSuccessDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          backgroundColor: Appcolors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ZoomIn(
                  duration: const Duration(milliseconds: 400),
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: Appcolors.black,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle_rounded,
                      size: 40,
                      color: Appcolors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                FadeInUp(
                  delay: const Duration(milliseconds: 150),
                  duration: const Duration(milliseconds: 350),
                  child: Text(
                    'Entry Saved!',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w700,
                      fontSize: 20,
                      color: Appcolors.black,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
                FadeInUp(
                  delay: const Duration(milliseconds: 250),
                  duration: const Duration(milliseconds: 350),
                  child: Text(
                    'Your work has been saved.',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      color: Appcolors.textColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 28),
                FadeInUp(
                  delay: const Duration(milliseconds: 350),
                  duration: const Duration(milliseconds: 350),
                  child: SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Appcolors.black,
                        foregroundColor: Appcolors.white,
                        elevation: 0,
                        shape: const StadiumBorder(),
                      ),
                      onPressed: () {
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const Mainscreen(),
                          ),
                          (route) => false,
                        );
                      },
                      child: const Text(
                        'CONTINUE',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    notesController.dispose();
    super.dispose();
  }
}