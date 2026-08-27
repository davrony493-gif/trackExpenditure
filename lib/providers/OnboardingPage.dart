import 'package:flutter/material.dart';
import 'package:track_expenses/providers/signin_provider.dart';
import 'package:track_expenses/screens/signin_screen.dart';

class OnboardingProvider extends ChangeNotifier {

  //!The controller wihout it we can not move on 
  final PageController pageController = PageController();

  //!The index 
  int currentPage = 0;

//!The data for boarding to just show off !
  final List<Map<String, String>> data = [
    {
      "title": 'Track Everything',
      "description":
          "Log your transactions with absolute precision. No clutter, just the data you need.",
    },
    {
      "title": "See the Big picture",
      "description":
          "Visualize your spending habits with elegant charts. Know exactly where your stand.",
    },
    {
      "title": "Own Your Budget",
      "description":
          "Make smarter financial decisions every single day. Let's get your money organized.",
    },
  ];

//!This is basically the entry !
  void onPageChanged(int index) {
    currentPage = index;
    notifyListeners(); //! Updates UI when swipe occurs
  }
//!This is function (UX) for moving on 
  void nextPage(BuildContext context) {
    if (currentPage < data.length - 1) {
      pageController.nextPage(
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOutCubic,
      );
    } else {
      //! Removes all previous widgets once it goes next page 
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const SignInScreen()),
        (route) => false,
      );
    }
  }

//!The function for button on the tap in borading to go back 
  void onBackPressed() {
    if (currentPage > 0) {
      pageController.previousPage(
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOutCubic,
      );
    }
  }
//!The imporatnat part cuz wihtout this the function deosnt work in UI 
  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }
}