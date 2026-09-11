import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class Permisionservice {
  static Future<void> requestPermissionsInOrder() async {
    try {
      if (Platform.isAndroid) {
        final sdkInt = await _getAndroidSdkInt();
        if (sdkInt < 33) {
          await requestStoragePermission();
        } else {
          await requestGalleryPermission();
        }
      } else {
        await requestGalleryPermission();
      }

      await requestLocationPermission();
      await requestCameraPermission();
    } catch (e) {
      print('Error -> $e');
    }
  }

  static Future<void> requestGalleryPermission() async {
    try {
      final status = await Permission.photos.status;
      if (status.isGranted || status.isLimited) {
        return;
      }

      if (status.isPermanentlyDenied) {
        await openAppSettings();
        return;
      }

      await Permission.photos.request();
    } catch (e) {
      print('Error -> $e');
    }
  }

  static Future<void> requestStoragePermission() async {
    try {
      final status = await Permission.storage.status;
      if (status.isGranted || status.isLimited) {
        return;
      }

      if (status.isPermanentlyDenied) {
        await openAppSettings();
        return;
      }

      await Permission.storage.request();
    } catch (e) {
      print('Error -> $e');
    }
  }

  static Future<void> requestLocationPermission() async {
    try {
      final status = await Permission.location.status;

      if (status.isGranted || status.isLimited) {
        return;
      }

      if (status.isPermanentlyDenied) {
        await openAppSettings();
        return;
      }

      await Permission.location.request();
    } catch (e) {
      print('Error -> $e');
    }
  }

  static Future<void> requestCameraPermission() async {
    try {
      final status = await Permission.camera.status;

      if (status.isGranted || status.isLimited) {
        return;
      }

      if (status.isPermanentlyDenied) {
        await openAppSettings();
        return;
      }

      await Permission.camera.request();
    } catch (e) {
      print('Error -> $e');
    }
  }

  static Future<int> _getAndroidSdkInt() async {
    if (!Platform.isAndroid) return 0;

    final androidInfo = await DeviceInfoPlugin().androidInfo;
    return androidInfo.version.sdkInt;
  }
}
