import 'package:flutter/material.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/screens/expenses.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/providers/expenditurePage.dart';

class Homepage extends ChangeNotifier {
  final String dollar = '\$';
  final String money = '12,450.00';

  int _selectedActionIndex = 0;
  int get selectedActionIndex => _selectedActionIndex;

  final List<Map<String, dynamic>> sozlar = [
    {
      'title': 'Whole Foods Market',
      'subtitle': 'Groceries • Today',
      'amount': '-\$142.30',
      'isIncome': false,
      'icon': Assets.icons.shoppingbag,
    },
    {
      'title': 'Acme Corp Salary',
      'subtitle': 'Income • Yesterday',
      'amount': '+\$3,500.00',
      'isIncome': true,
      'icon': Assets.icons.blackdollar,
    },
    {
      'title': 'Electric Utility',
      'subtitle': 'Bills • Jun 12',
      'amount': '-\$85.00',
      'isIncome': false,
      'icon': Assets.icons.filledblacklight,
    },
    {
      'title': 'Artisan Roasters',
      'subtitle': 'Dining • Jun 11',
      'amount': '-\$6.50',
      'isIncome': false,
      'icon': Assets.icons.filledcup,
    },
  ];

  void selectActionIndex(int index) {
    if (_selectedActionIndex != index) {
      _selectedActionIndex = index;
      notifyListeners();
    }
  }

  void openExpenses(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChangeNotifierProvider(
          create: (_) => Expenditurepage(),
          child: const Expenses(),
        ),
      ),
    );
  }
}
