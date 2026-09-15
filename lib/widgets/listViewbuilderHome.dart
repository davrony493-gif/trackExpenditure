import 'dart:io';
import 'dart:ui';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:track_expenses/consts/colors/appcolors.dart';
import 'package:track_expenses/gen/assets.gen.dart';
import 'package:track_expenses/service/audio_service.dart';
import 'package:track_expenses/models/expense_Model.dart';
import 'package:track_expenses/providers/homePage.dart';

class ItemWidget extends StatefulWidget {
  const ItemWidget({super.key, required this.expenseModel});

  final ExpenseModel expenseModel;

  @override
  State<ItemWidget> createState() => _ItemWidgetState();
}

class _ItemWidgetState extends State<ItemWidget> with TickerProviderStateMixin {
  late final AnimationController _animationController;
  late final AnimationController _chevronController;
  late final Animation<double> _chevronTurns;
  String? _resolvedImagePath;

  @override
  void initState() {
    super.initState();

    _resolveActualImagePath();

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _chevronController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _chevronTurns = Tween<double>(begin: 0.0, end: 0.5).animate(
      CurvedAnimation(parent: _chevronController, curve: Curves.easeInOut),
    );
  }

  Future<void> _resolveActualImagePath() async {
    final rawPath = widget.expenseModel.image;
    if (rawPath == null || rawPath.trim().isEmpty) return;

    if (File(rawPath).existsSync()) {
      if (mounted) setState(() => _resolvedImagePath = rawPath);
      return;
    }

    try {
      final docsDir = await getApplicationDocumentsDirectory();
      final fileName = path.basename(rawPath);
      final fallbackFile = File(path.join(docsDir.path, fileName));
      final attachmentsFile =
          File(path.join(docsDir.path, 'attachments', fileName));

      if (fallbackFile.existsSync() && mounted) {
        setState(() => _resolvedImagePath = fallbackFile.path);
      } else if (attachmentsFile.existsSync() && mounted) {
        setState(() => _resolvedImagePath = attachmentsFile.path);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    // _audioPlayer?.dispose();
    _animationController.dispose();
    _chevronController.dispose();
    super.dispose();
  }

  ExpenseModel get expenseModel => widget.expenseModel;

  bool _isRenderableImageFile(String? filePath) {
    if (filePath == null || filePath.trim().isEmpty) return false;

    final lowerPath = filePath.toLowerCase();
    const supportedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.heic',
      '.heif',
      '.bmp',
    ];

    return supportedExtensions.any(lowerPath.endsWith);
  }

  // ignore: unused_element
  bool _isAudioFile(String? filePath) {
    if (filePath == null || filePath.trim().isEmpty) return false;
    final lowerPath = filePath.toLowerCase();
    const supportedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
    return supportedExtensions.any(lowerPath.endsWith);
  }

  bool get _isMusicItem {
    final filePath = expenseModel.image;
    return (expenseModel.type == ExpenseCategory.music) ||
        (filePath != null &&
            filePath.trim().isNotEmpty &&
            !_isRenderableImageFile(filePath));
  }

  String _getAudioFileName(String rawPath) {
    return path.basename(rawPath);
  }

  String _getCategoryIcon(ExpenseCategory category) {
    switch (category) {
      case ExpenseCategory.home:
        return Assets.icons.home;
      case ExpenseCategory.food:
        return Assets.icons.fork;
      case ExpenseCategory.transit:
        return Assets.icons.blackcar;
      case ExpenseCategory.shop:
        return Assets.icons.shoppingbag2;
      case ExpenseCategory.bills:
        return Assets.icons.blacklighting;
      case ExpenseCategory.more:
      case ExpenseCategory.music:
      // ignore: unreachable_switch_default
      default:
        return Assets.icons.more;
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'Today';
    if (date is DateTime) {
      return DateFormat.yMMMMd().format(date);
    }
    if (date is String) {
      final parsed = DateTime.tryParse(date);
      return parsed != null ? DateFormat.yMMMMd().format(parsed) : date;
    }
    return date.toString();
  }

  void _openImagePreview(BuildContext context, String heroTag, File imageFile) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierDismissible: true,
        barrierColor: Colors.black.withValues(alpha: 0.3),
        pageBuilder: (context, animation, secondaryAnimation) {
          return FadeTransition(
            opacity: animation,
            child: Scaffold(
              backgroundColor: Colors.transparent,
              body: Stack(
                fit: StackFit.expand,
                children: [
                  BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 18.0, sigmaY: 18.0),
                    child: GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                  Center(
                    child: Hero(
                      tag: heroTag,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.sizeOf(context).width * 0.85,
                            maxHeight: MediaQuery.sizeOf(context).height * 0.65,
                          ),
                          child: Image.file(imageFile, fit: BoxFit.contain),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: MediaQuery.paddingOf(context).top + 16,
                    right: 20,
                    child: IconButton(
                      icon: const Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 28,
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLeading(ThemeData theme, String heroTag) {
    final validPath = _resolvedImagePath ?? expenseModel.image;

    if (validPath != null &&
        validPath.trim().isNotEmpty &&
        _isRenderableImageFile(validPath) &&
        File(validPath).existsSync()) {
      return GestureDetector(
        onTap: () => _openImagePreview(context, heroTag, File(validPath)),
        child: Hero(
          tag: heroTag,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              File(validPath),
              width: 48,
              height: 48,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  _buildIconFallback(theme),
            ),
          ),
        ),
      );
    }

    return _buildIconFallback(theme);
  }

  Widget _buildIconFallback(ThemeData theme) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: _isMusicItem
            ? Icon(
                CupertinoIcons.music_note_2,
                color: theme.colorScheme.onSurface,
                size: 22,
              )
            : Padding(
                padding: const EdgeInsets.all(12.0),
                child: SvgPicture.asset(
                  _getCategoryIcon(expenseModel.type),
                  colorFilter: ColorFilter.mode(
                    theme.colorScheme.onSurface,
                    BlendMode.srcIn,
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildRegularItem(ThemeData theme, String heroTag, bool isIncome) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: _buildLeading(theme, heroTag),
      title: Text(
        (expenseModel.note != null && expenseModel.note!.trim().isNotEmpty)
            ? expenseModel.note!
            : expenseModel.type.name.toUpperCase(),
        style: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 16,
          color: theme.colorScheme.onSurface,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${expenseModel.type.name.toUpperCase()} ',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
          Text(
            '${_formatDate(expenseModel.createdAt)} ',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            '${isIncome ? "+" : "-"}\$${expenseModel.value.toStringAsFixed(2)}',
            style: TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w500,
              fontSize: 16,
              color: isIncome ? Appcolors.green : theme.colorScheme.onSurface,
            ),
          ),
          Builder(
            builder: (_) {
              final imagePath = _resolvedImagePath ?? expenseModel.image;
              final canShare =
                  imagePath != null &&
                  imagePath.trim().isNotEmpty &&
                  File(imagePath).existsSync();

              if (!canShare) {
                return const SizedBox.shrink();
              }

              return IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                iconSize: 20,
                onPressed: () async {
                  final sharePath = _resolvedImagePath ?? expenseModel.image;
                  if (sharePath == null ||
                      sharePath.trim().isEmpty ||
                      !File(sharePath).existsSync()) {
                    return;
                  }

                  await SharePlus.instance.share(
                    ShareParams(files: [XFile(sharePath)]),
                  );
                },
                icon: const Icon(CupertinoIcons.share),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMusicItem(ThemeData theme, String heroTag) {
    final fileName =
        (expenseModel.image != null && expenseModel.image!.trim().isNotEmpty)
        ? _getAudioFileName(expenseModel.image!)
        : 'Audio Note';

    return Theme(
      data: theme.copyWith(
        dividerColor: Colors.transparent,
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        hoverColor: Colors.transparent,
      ),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: EdgeInsets.zero,
        minTileHeight: 64,
        onExpansionChanged: (expanded) {
          if (expanded) {
            _chevronController.forward();
          } else {
            _chevronController.reverse();
          }
        },
        leading: _buildLeading(theme, heroTag),
        title: Text(
          (expenseModel.note != null && expenseModel.note!.trim().isNotEmpty)
              ? expenseModel.note!
              : expenseModel.type.name.toUpperCase(),
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: theme.colorScheme.onSurface,
          ),
        ),
        subtitle: null,
        trailing: RotationTransition(
          turns: _chevronTurns,
          child: const Icon(CupertinoIcons.chevron_down, size: 18),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 4.0, bottom: 10.0),
            child: Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(
                  alpha: 0.5,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: StreamBuilder<MediaItem?>(
                stream: audioHandler.mediaItem,
                builder: (context, mediaSnapshot) {
                  return StreamBuilder<PlaybackState>(
                    stream: audioHandler.playbackState,
                    builder: (context, playbackSnapshot) {
                      final rawAudioPath =
                          _resolvedImagePath ?? expenseModel.image;
                      final currentMedia = mediaSnapshot.data;
                      final playbackState = playbackSnapshot.data;

                      final isCurrentItem = rawAudioPath != null &&
                          rawAudioPath.trim().isNotEmpty &&
                          currentMedia?.id == rawAudioPath;

                      final isPlaying = isCurrentItem &&
                          (playbackState?.playing ?? false);

                      final totalSeconds = (isCurrentItem &&
                              currentMedia?.duration != null)
                          ? currentMedia!.duration!.inSeconds.toDouble()
                          : 0.0;

                      final currentSeconds =
                          (isCurrentItem && playbackState != null)
                              ? playbackState.position.inSeconds.toDouble()
                              : 0.0;

                      final maxDuration =
                          totalSeconds > 0 ? totalSeconds : 1.0;
                      final sliderVal = currentSeconds.clamp(0.0, maxDuration);

                      return ListTile(
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12.0,
                          vertical: 2.0,
                        ),
                        leading: IconButton(
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () async {
                            var targetPath = rawAudioPath;
                            if (targetPath == null ||
                                targetPath.trim().isEmpty ||
                                !File(targetPath).existsSync()) {
                              try {
                                final docsDir =
                                    await getApplicationDocumentsDirectory();
                                final fName =
                                    path.basename(expenseModel.image ?? '');
                                final f1 = File(path.join(docsDir.path, fName));
                                final f2 = File(path.join(
                                    docsDir.path, 'attachments', fName));
                                if (f1.existsSync()) {
                                  targetPath = f1.path;
                                } else if (f2.existsSync()) {
                                  targetPath = f2.path;
                                }
                              } catch (_) {}
                            }

                            if (targetPath == null ||
                                !File(targetPath).existsSync()) {
                              debugPrint('Audio file not found: $targetPath');
                              return;
                            }

                            if (isCurrentItem && isPlaying) {
                              await audioHandler.pause();
                            } else if (isCurrentItem && !isPlaying) {
                              await audioHandler.play();
                            } else {
                              await audioHandler.playFile(
                                filePath: targetPath,
                                title: (expenseModel.note != null &&
                                        expenseModel.note!.trim().isNotEmpty)
                                    ? expenseModel.note!
                                    : fileName,
                              );
                            }
                          },
                          icon: Icon(
                            isPlaying
                                ? CupertinoIcons.pause_fill
                                : CupertinoIcons.play_fill,
                            size: 28,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                        title: Text(
                          fileName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        trailing: IconButton(
                          onPressed: () async {
                            if (rawAudioPath != null &&
                                File(rawAudioPath).existsSync()) {
                              SharePlus.instance.share(
                                ShareParams(
                                  files: [XFile(rawAudioPath)],
                                  title: fileName,
                                ),
                              );
                            }
                          },
                          icon: const Icon(CupertinoIcons.share),
                        ),
                        subtitle: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onHorizontalDragStart: (_) {},
                          onTapDown: (_) {},
                          child: SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              trackHeight: 3.0,
                              thumbShape: const RoundSliderThumbShape(
                                enabledThumbRadius: 6.0,
                              ),
                              overlayShape: const RoundSliderOverlayShape(
                                overlayRadius: 12.0,
                              ),
                            ),
                            child: Slider(
                              min: 0.0,
                              max: maxDuration,
                              value: sliderVal,
                              activeColor: theme.colorScheme.primary,
                              inactiveColor:
                                  theme.colorScheme.onSurface.withValues(
                                alpha: 0.2,
                              ),
                              onChanged: (v) {
                                if (isCurrentItem) {
                                  audioHandler.seek(
                                    Duration(seconds: v.toInt()),
                                  );
                                }
                              },
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isIncome = expenseModel.isIncome;
    final theme = Theme.of(context);
    final heroTag = 'expense_image_${expenseModel.id ?? expenseModel.hashCode}';

    // Debug: log whether this item is treated as a music/audio item
    debugPrint(
      'Item ${expenseModel.id ?? expenseModel.hashCode} isMusic=$_isMusicItem image=${expenseModel.image}',
    );

    final content = Material(
      color: Colors.transparent,
      child: SizedBox(
        width: MediaQuery.sizeOf(context).width - 32,
        child: Card(
          elevation: 0,
          margin: EdgeInsets.zero,
          clipBehavior: Clip.antiAlias,
          color: theme.colorScheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: theme.dividerColor.withValues(alpha: 0.08),
              width: 1,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            child: _isMusicItem
                ? _buildMusicItem(theme, heroTag)
                : _buildRegularItem(theme, heroTag, isIncome),
          ),
        ),
      ),
    );

    return Dismissible(
      key: Key('expense_${expenseModel.id ?? expenseModel.hashCode}'),
      direction: DismissDirection.endToStart,
      background: Container(
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(CupertinoIcons.delete, color: Colors.white, size: 28),
      ),
      onDismissed: (_) {
        final id = expenseModel.id;
        if (id != null) {
          context.read<Homepage>().deleteExpenseById(id: id, onSuccess: () {});
        }
      },
      child: content,
    );
  }
}
