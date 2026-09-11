// dart format width=80

/// GENERATED CODE - DO NOT MODIFY BY HAND
/// *****************************************************
///  FlutterGen
/// *****************************************************

// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: deprecated_member_use,directives_ordering,implicit_dynamic_list_literal,unnecessary_import

import 'package:flutter/widgets.dart';

class $AssetsIconsGen {
  const $AssetsIconsGen();

  /// File path: assets/icons/Bill.svg
  String get bill => 'assets/icons/Bill.svg';

  /// File path: assets/icons/Logo.svg
  String get logo => 'assets/icons/Logo.svg';

  /// File path: assets/icons/blackHome.svg
  String get blackHome => 'assets/icons/blackHome.svg';

  /// File path: assets/icons/blackcar.svg
  String get blackcar => 'assets/icons/blackcar.svg';

  /// File path: assets/icons/blackdollar.svg
  String get blackdollar => 'assets/icons/blackdollar.svg';

  /// File path: assets/icons/blacklighting.svg
  String get blacklighting => 'assets/icons/blacklighting.svg';

  /// File path: assets/icons/cancel.svg
  String get cancel => 'assets/icons/cancel.svg';

  /// File path: assets/icons/filledblacklight.svg
  String get filledblacklight => 'assets/icons/filledblacklight.svg';

  /// File path: assets/icons/filledcup.svg
  String get filledcup => 'assets/icons/filledcup.svg';

  /// File path: assets/icons/fork.svg
  String get fork => 'assets/icons/fork.svg';

  /// File path: assets/icons/home.svg
  String get home => 'assets/icons/home.svg';

  /// File path: assets/icons/menu.svg
  String get menu => 'assets/icons/menu.svg';

  /// File path: assets/icons/more.svg
  String get more => 'assets/icons/more.svg';

  /// File path: assets/icons/profile.svg
  String get profile => 'assets/icons/profile.svg';

  /// File path: assets/icons/save.svg
  String get save => 'assets/icons/save.svg';

  /// File path: assets/icons/settings.svg
  String get settings => 'assets/icons/settings.svg';

  /// File path: assets/icons/shoppingbag.svg
  String get shoppingbag => 'assets/icons/shoppingbag.svg';

  /// File path: assets/icons/shoppingbag2.svg
  String get shoppingbag2 => 'assets/icons/shoppingbag2.svg';

  /// File path: assets/icons/statistics.svg
  String get statistics => 'assets/icons/statistics.svg';

  /// File path: assets/icons/wallet.svg
  String get wallet => 'assets/icons/wallet.svg';

  /// List of all assets
  List<String> get values => [
    bill,
    logo,
    blackHome,
    blackcar,
    blackdollar,
    blacklighting,
    cancel,
    filledblacklight,
    filledcup,
    fork,
    home,
    menu,
    more,
    profile,
    save,
    settings,
    shoppingbag,
    shoppingbag2,
    statistics,
    wallet,
  ];
}

class $AssetsImagesGen {
  const $AssetsImagesGen();

  /// File path: assets/images/logo.png
  AssetGenImage get logo => const AssetGenImage('assets/images/logo.png');

  /// List of all assets
  List<AssetGenImage> get values => [logo];
}

class $AssetsLottiesGen {
  const $AssetsLottiesGen();

  /// File path: assets/lotties/nodata.json
  String get nodata => 'assets/lotties/nodata.json';

  /// List of all assets
  List<String> get values => [nodata];
}

abstract final class Assets {
  static const $AssetsIconsGen icons = $AssetsIconsGen();
  static const $AssetsImagesGen images = $AssetsImagesGen();
  static const $AssetsLottiesGen lotties = $AssetsLottiesGen();
}

class AssetGenImage {
  const AssetGenImage(
    this._assetName, {
    this.size,
    this.flavors = const {},
    this.animation,
  });

  final String _assetName;

  final Size? size;
  final Set<String> flavors;
  final AssetGenImageAnimation? animation;

  Image image({
    Key? key,
    AssetBundle? bundle,
    ImageFrameBuilder? frameBuilder,
    ImageErrorWidgetBuilder? errorBuilder,
    String? semanticLabel,
    bool excludeFromSemantics = false,
    double? scale,
    double? width,
    double? height,
    Color? color,
    Animation<double>? opacity,
    BlendMode? colorBlendMode,
    BoxFit? fit,
    AlignmentGeometry alignment = Alignment.center,
    ImageRepeat repeat = ImageRepeat.noRepeat,
    Rect? centerSlice,
    bool matchTextDirection = false,
    bool gaplessPlayback = true,
    bool isAntiAlias = false,
    String? package,
    FilterQuality filterQuality = FilterQuality.medium,
    int? cacheWidth,
    int? cacheHeight,
  }) {
    return Image.asset(
      _assetName,
      key: key,
      bundle: bundle,
      frameBuilder: frameBuilder,
      errorBuilder: errorBuilder,
      semanticLabel: semanticLabel,
      excludeFromSemantics: excludeFromSemantics,
      scale: scale,
      width: width,
      height: height,
      color: color,
      opacity: opacity,
      colorBlendMode: colorBlendMode,
      fit: fit,
      alignment: alignment,
      repeat: repeat,
      centerSlice: centerSlice,
      matchTextDirection: matchTextDirection,
      gaplessPlayback: gaplessPlayback,
      isAntiAlias: isAntiAlias,
      package: package,
      filterQuality: filterQuality,
      cacheWidth: cacheWidth,
      cacheHeight: cacheHeight,
    );
  }

  ImageProvider provider({AssetBundle? bundle, String? package}) {
    return AssetImage(_assetName, bundle: bundle, package: package);
  }

  String get path => _assetName;

  String get keyName => _assetName;
}

class AssetGenImageAnimation {
  const AssetGenImageAnimation({
    required this.isAnimation,
    required this.duration,
    required this.frames,
  });

  final bool isAnimation;
  final Duration duration;
  final int frames;
}
