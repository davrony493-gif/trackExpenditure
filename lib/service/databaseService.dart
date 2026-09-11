import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import 'package:track_expenses/models/expense_Model.dart';

class Databaseservice {
  static Database? db;
  static final String databaseName = 'expenses.db';
  static final String tableName = 'expenses';
  static const int databaseVersion = 2;

  static Future<void> init(String filePath) async {
    try {
      final dbPath = await getDatabasesPath();
      final normalizedFilePath = filePath.endsWith('.db')
          ? filePath
          : '$filePath.db';
      final path = join(dbPath, normalizedFilePath);
      db = await openDatabase(
        path,
        version: databaseVersion,
        onCreate: _createDB,
        onUpgrade: _upgradeDB,
      );
    } catch (error) {
      print('Database init error: $error');
      rethrow;
    }
  }

  static Future<void> _createDB(Database database, int version) async {
    await database.execute('''
    CREATE TABLE $tableName (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note TEXT,
      value REAL,
      createdAt TEXT,
      image TEXT,
      type TEXT,
      isIncome INTEGER
    )
  ''');
  }

  static Future<void> _upgradeDB(
    Database database,
    int oldVersion,
    int newVersion,
  ) async {
    if (oldVersion < 2) {
      final columns = await database.rawQuery('PRAGMA table_info($tableName)');
      final hasImageColumn = columns.any((column) => column['name'] == 'image');

      if (!hasImageColumn) {
        await database.execute('ALTER TABLE $tableName ADD COLUMN image TEXT');
      }
    }
  }

  static Future<void> closeDb() async {
    if (db != null && db!.isOpen) {
      await db!.close();
    }
    db = null;
  }

  static Future<void> addExpensesToDb(ExpenseModel expense) async {
    if (db == null || !db!.isOpen) {
      await init(databaseName);
    }

    if (db == null) {
      return;
    }

    Map<String, dynamic> row = {
      'note': expense.note,
      'value': expense.value,
      'createdAt': expense.createdAt,
      'image': expense.image,
      'isIncome': expense.isIncome ? 1 : 0,
      'type': expense.type.name,
    };
    await db!.insert(tableName, row);
  }

  static Future<List<ExpenseModel>> getAllExpenses() async {
    if (db == null || !db!.isOpen) {
      return [];
    }

    final List<Map<String, dynamic>> expense = await db!.query(tableName);

    return List.generate(expense.length, (index) {
      final row = expense[index];

      return ExpenseModel(
        id: row['id'],
        note: row['note'] as String? ?? '',
        image: row['image'] as String?,
        value: (row['value'] as num).toDouble(),
        createdAt: row['createdAt'] as String? ?? 'Empty',
        isIncome: (row['isIncome'] as int?) == 1,
        type: ExpenseCategory.values.firstWhere(
          (e) => e.toString() == row['type'] || e.name == row['type'],
          orElse: () => ExpenseCategory.home,
        ),
      );
    });
  }

  static Future<void> clearAllExpenses() async {
    try {
      if (db == null || !db!.isOpen) {
        return;
      }

      await db!.delete(tableName);
      // Optional: reset auto-increment ID back to 1
      await db!.delete(
        'sqlite_sequence',
        where: 'name = ?',
        whereArgs: [tableName],
      );
    } catch (e) {
      // ignore: avoid_print
      print('Error clearing expenses: $e');
    }
  }

  static Future<void> deleteExpenseById(int id) async {
    try {
      if (db == null || !db!.isOpen) {
        return;
      }
      await db!.delete(tableName, where: 'id = ?', whereArgs: [id]);
    } catch (e) {
      // ignore: avoid_print
      print('Error deleting expense $id: $e');
    }
  }

  /// Completely deletes the database file from local storage
  static Future<void> deleteDatabaseFile() async {
    try {
      final dbPath = await getDatabasesPath();
      final path = join(dbPath, databaseName);
      await closeDb();
      await deleteDatabase(path);
    } catch (e) {
      // ignore: avoid_print
      print('Error deleting database file: $e');
    }
  }
}
