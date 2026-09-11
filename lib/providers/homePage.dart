import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/models/expense_Model.dart';
import 'package:track_expenses/providers/expenditurePage.dart';
import 'package:track_expenses/screens/expenses.dart';
import 'package:track_expenses/service/databaseService.dart';

class Homepage extends ChangeNotifier {
  final String dollar = '\$';

  double get totalIncomeValue => expenses
      .where((expense) => expense.isIncome)
      .fold(0.0, (sum, expense) => sum + expense.value);

  double get totalOutcomeValue => expenses
      .where((expense) => !expense.isIncome)
      .fold(0.0, (sum, expense) => sum + expense.value);

  double get totalBalanceValue => totalIncomeValue - totalOutcomeValue;

  String get totalIncome => totalIncomeValue.toStringAsFixed(2);
  String get totalOutcome => totalOutcomeValue.toStringAsFixed(2);
  String get totalBalance => totalBalanceValue.abs().toStringAsFixed(2);
  String get money => totalBalance;

  int _selectedActionIndex = 0;
  int get selectedActionIndex => _selectedActionIndex;

  // The expenses list accessible by Homescreen
  List<ExpenseModel> expenses = [];

  void selectActionIndex(int index) {
    if (_selectedActionIndex != index) {
      _selectedActionIndex = index;
      notifyListeners();
    }
  }

  Future<void> openExpenses(BuildContext context) async {
    await Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => ChangeNotifierProvider(
          create: (_) => Expenditurepage(),
          child: const Expenses(),
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) => FadeTransition(opacity: animation, child: child,),
        transitionDuration: Duration(seconds: 1),
        reverseTransitionDuration: Duration(seconds: 1)
      ),
    );

    await getExpensefromDb();
  }

  Future<void> getExpensefromDb() async {
    try {
      final info = await Databaseservice.getAllExpenses();
      expenses = info;
      notifyListeners();
    } catch (e) {
      // ignore: avoid_print
      print('Error fetching expenses: $e');
    }
  }

  /// Clears all database records and refreshes the home screen list
  Future<void> clearAllExpenses() async {
    try {
      await Databaseservice.clearAllExpenses();
      await getExpensefromDb();
    } catch (e) {
      // ignore: avoid_print
      print('Error clearing expenses in Homepage: $e');
    }
    notifyListeners();
  }

  /// Deletes a specific expense record by ID and refreshes the list
  Future<void> deleteExpenseById({
    required int id,
    required Function onSuccess,
  }) async {
    try {
      await Databaseservice.deleteExpenseById(id);
      await getExpensefromDb();
      onSuccess();
    } catch (e) {
      // ignore: avoid_print
      print('Error deleting expense $id in Homepage: $e');
    }
    notifyListeners();
  }
}
