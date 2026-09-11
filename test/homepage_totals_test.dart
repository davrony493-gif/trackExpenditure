import 'package:flutter_test/flutter_test.dart';
import 'package:track_expenses/models/expense_Model.dart';
import 'package:track_expenses/providers/homePage.dart';

void main() {
  test('homepage totals are derived from actual SQLite expense records', () {
    final homepage = Homepage();
    homepage.expenses = [
      ExpenseModel(
        note: 'salary',
        value: 100,
        isIncome: true,
        type: ExpenseCategory.home,
      ),
      ExpenseModel(
        note: 'rent',
        value: 35.5,
        isIncome: false,
        type: ExpenseCategory.bills,
      ),
      ExpenseModel(
        note: 'coffee',
        value: 3.5,
        isIncome: false,
        type: ExpenseCategory.food,
      ),
    ];

    expect(homepage.totalBalance, '61.00');
    expect(homepage.totalIncome, '100.00');
    expect(homepage.totalOutcome, '39.00');
  });
}
