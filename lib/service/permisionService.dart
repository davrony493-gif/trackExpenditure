import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class Permisionservice {
  static Future<void> requestGalleryPermission() async {
    try {
      if (Platform.isAndroid) {
        final sdkInt = await _getAndroidSdkInt();

        if (sdkInt < 33) {
          final status = await Permission.storage.status;

          if (status.isGranted || status.isLimited) {
            return;
          }

          if (status.isPermanentlyDenied) {
            await openAppSettings();
            return;
          }

          final requested = await Permission.storage.request();
          if (requested.isGranted || requested.isLimited) {
            return;
          }
          return;
        }
      }

      final status = await Permission.photos.status;
      if (status.isGranted || status.isLimited) {
        return;
      }

      if (status.isPermanentlyDenied) {
        await openAppSettings();
        return;
      }

      final requested = await Permission.photos.request();
      if (requested.isGranted || requested.isLimited) {
        return;
      }
    } catch (e) {
      // ignore: avoid_print
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

      final requested = await Permission.location.request();
      if (requested.isGranted || requested.isLimited) {
        return;
      }
    } catch (e) {
      // ignore: avoid_print
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

      final requested = await Permission.camera.request();
      if (requested.isGranted || requested.isLimited) {
        return;
      }
    } catch (e) {
      // ignore: avoid_print
      print('Error -> $e');
    }
  }

  static Future<int> _getAndroidSdkInt() async {
    if (!Platform.isAndroid) return 0;

    final androidInfo = await DeviceInfoPlugin().androidInfo;
    final sdkInt = androidInfo.version.sdkInt;
    return sdkInt ?? 0;
  }

  
}
