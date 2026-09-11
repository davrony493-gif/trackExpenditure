// ignore_for_file: unused_local_variable

import 'dart:io';

import 'package:animate_do/animate_do.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/models/expense_Model.dart';
import 'package:track_expenses/providers/homePage.dart';
import 'package:track_expenses/screens/mainscreen.dart';
import 'package:track_expenses/service/databaseService.dart';

class Expenditurepage extends ChangeNotifier {
  File? rasm;

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

  final TextEditingController amountController = TextEditingController(
    text: '0.00',
  );

  bool _isExpense = true;
  bool get isExpense => _isExpense;

  int _selectedCategoryIndex = 0;
  int get selectedCategoryIndex => _selectedCategoryIndex;

  final TextEditingController notesController = TextEditingController();

  String? _noteErrorText;
  String? get noteErrorText => _noteErrorText;

  void updateAmount(String newAmount) {
    amount = newAmount;
    if (amountController.text != newAmount) {
      amountController.value = TextEditingValue(
        text: newAmount,
        selection: TextSelection.collapsed(offset: newAmount.length),
      );
    }
    notifyListeners();
  }

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

  void resetForm() {
    amount = '0.00';
    amountController.text = '0.00';
    notesController.clear();
    _noteErrorText = null;
    _selectedCategoryIndex = 0;
    _isExpense = true;
    rasm = null;
    notifyListeners();
  }

  Future<void> sendIncome(BuildContext context) async {
    FocusScope.of(context).unfocus();

    final note = notesController.text.trim();

    if (note.isEmpty) {
      _noteErrorText = 'Please add a note before saving';
      notifyListeners();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add a note before saving!'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    _noteErrorText = null;
    notifyListeners();

    final double parsedValue =
        double.tryParse(
          amountController.text.trim().isEmpty
              ? amount
              : amountController.text.trim(),
        ) ??
        0.0;

    final newExpense = ExpenseModel(
      id: 0,
      note: note,
      image: rasm?.path,
      value: parsedValue,
      isIncome: !_isExpense,
      type: ExpenseCategory.values[_selectedCategoryIndex],
      createdAt: DateFormat.yMMMMd().format(DateTime.now()),
    );

    await Databaseservice.addExpensesToDb(newExpense);

    if (context.mounted) {
      _showSuccessDialog(context);
    }
  }

  Future<void> pickFileFromFolder({required BuildContext context}) async {
    try {
      final result = await FilePicker.pickFiles(
        dialogTitle: 'Choose File',
        type: FileType.any,
      );

      if (result != null && result.files.isNotEmpty && result.files.single.path != null) {
        rasm = File(result.files.single.path!);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error-> $e');
    }
  }

  Future<void> pickImageFromGallery() async {
    try {
      final picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 100,
      );

      if (pickedFile != null) {
        rasm = File(pickedFile.path);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error -> $e');
    }
  }

  Future<void> removeImage() async {
    rasm = null;
    notifyListeners();
  }

  Future<void> pickImageFromCamera() async {
    try {
      final picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 100,
      );

      if (pickedFile != null) {
        rasm = File(pickedFile.path);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error -> $e');
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
                        resetForm();

                        final homeProvider = context.read<Homepage>();

                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ChangeNotifierProvider.value(
                              value: homeProvider,
                              child: const Mainscreen(),
                            ),
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
    amountController.dispose();
    super.dispose();
  }
}
