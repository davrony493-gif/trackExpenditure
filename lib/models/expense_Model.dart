class ExpenseModel {
  final int? id;
  final double value;
  final bool isIncome;
  final ExpenseCategory type;
  final String? note;
  final String? image;
  final String? createdAt;

  ExpenseModel({
    this.id,
    required this.value,
    required this.isIncome,
    required this.type,
    this.note,
    this.image,
    this.createdAt,
  });

  static ExpenseCategory parseCategory(String? rawValue) {
    final normalized = (rawValue ?? '').trim();
    if (normalized.isEmpty) return ExpenseCategory.home;

    final value = normalized.toLowerCase().replaceFirst('expensecategory.', '');

    for (final category in ExpenseCategory.values) {
      if (category.name.toLowerCase() == value) {
        return category;
      }
    }

    return ExpenseCategory.home;
  }

  Map<String, dynamic> toJson() => {
    'note': note,
    'value': value,
    'type': type.name,
    'isIncome': isIncome,
    'image': image,
    'createdAt': createdAt,
  };
}

enum ExpenseCategory { home, food, transit, shop, bills, more, music }
