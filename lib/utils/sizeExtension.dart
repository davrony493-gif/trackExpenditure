import 'package:flutter/material.dart';

extension Sizeextension on BuildContext {
  double get width => MediaQuery.sizeOf(this).width;
  double get height => MediaQuery.sizeOf(this).height;
}

extension TextExtension on String {
  
}