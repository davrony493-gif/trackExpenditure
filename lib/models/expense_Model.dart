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

  Map<String, dynamic> toJson() => {
    "note": note, //* String
    "value": value, //* double & int
    "type": type, //*String
    "isIncome": isIncome, //* Bool
  };
}

enum ExpenseCategory { home, food, transit, shop, bills, more }
