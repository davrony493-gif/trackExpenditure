import 'package:audio_service/audio_service.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import 'package:track_expenses/providers/homePage.dart';
import 'package:track_expenses/service/audio_service.dart';
import 'package:track_expenses/utils/sizeExtension.dart';
import 'package:url_launcher/url_launcher.dart';

class Customdrawer extends StatefulWidget {
  const Customdrawer({super.key});

  @override
  State<Customdrawer> createState() => _CustomdrawerState();
}

class _CustomdrawerState extends State<Customdrawer>
    with TickerProviderStateMixin {
  late final AnimationController _themeController;
  late final AnimationController _playPauseController;
  bool _isDarkMode = false;

  @override
  void initState() {
    super.initState();
    _themeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _playPauseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _themeController.dispose();
    _playPauseController.dispose();
    super.dispose();
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(scheme: 'tel', path: phoneNumber);
    await launchUrl(launchUri);
  }

  void _toggleTheme() {
    setState(() {
      _isDarkMode = !_isDarkMode;
    });

    if (_isDarkMode) {
      _themeController.forward();
    } else {
      _themeController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.read<Homepage>();
    final theme = Theme.of(context);

    return Container(
      width: context.width * 0.8,
      height: context.height,
      color: theme.scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(
          children: [
            Card(
              
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: StreamBuilder<PlaybackState>(
                stream: audioHandler.playbackState,
                builder: (context, snapshot) {
                  final playbackState = snapshot.data;
                  final isPlaying = playbackState?.playing ?? false;

                  return ListTile(
                    subtitle: StreamBuilder<MediaItem?>(
                      stream: audioHandler.mediaItem,
                      builder: (context, mediaSnapshot) {
                        final currentMedia = mediaSnapshot.data;
                        final totalSeconds = (currentMedia?.duration != null)
                            ? currentMedia!.duration!.inSeconds.toDouble()
                            : 0.0;
                        final currentSeconds = (playbackState != null)
                            ? playbackState.position.inSeconds.toDouble()
                            : 0.0;

                        final maxDuration = totalSeconds > 0 ? totalSeconds : 1.0;
                        final sliderVal = currentSeconds.clamp(0.0, maxDuration);
                        //* The way of adding slider !
                        return GestureDetector(
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
                                if (currentMedia != null) {
                                  audioHandler.seek(
                                    Duration(seconds: v.toInt()),
                                  );
                                }
                              },
                            ),
                          ),
                        );
                      },
                    ),
                    title: StreamBuilder<MediaItem?>(
                     stream: audioHandler.mediaItem,
                      builder: (context, mediaSnapshot) {
                        final currentMedia = mediaSnapshot.data;
                        final displayTitle = currentMedia != null
                            ? currentMedia.id.split('/').last
                            : 'No audio loaded';

                        return Text(
                          displayTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface,
                          ),
                        );
                      },
                    ),
                    leading: IconButton(
                      onPressed: () async {
                        if (isPlaying) {
                          audioHandler.pause();
                        } else {
                          audioHandler.play();
                        }
                      },
                      icon: Icon(isPlaying ? Icons.pause : Icons.play_arrow),
                    ),
                  );
                },
              ),
            ),
            ListTile(
              title: const Text('CLEAR cash'),
              trailing: IconButton(
                onPressed: () {
                  showCupertinoDialog(
                    context: context,
                    builder: (context) => CupertinoAlertDialog(
                      title: const Text('Confirm to clear the cash'),
                      actions: [
                        CupertinoActionSheetAction(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          child: Text(
                            'Cancel',
                            style: TextStyle(
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                        ),
                        CupertinoActionSheetAction(
                          onPressed: () {
                            Navigator.pop(context);
                            state.clearAllExpenses();
                          },
                          child: Text(
                            'Confirm',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                icon: const Icon(CupertinoIcons.delete),
              ),
            ),
            ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 4,
              ),
              title: const Text('Theme Mode'),
              trailing: IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 54, minHeight: 32),
                onPressed: _toggleTheme,
                tooltip: 'Toggle Theme',
                icon: SizedBox(
                  width: 76,
                  height: 42,
                  child: LottieBuilder.asset(
                    controller: _themeController,
                    'assets/lotties/Switch.json',
                    repeat: false,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
            ListTile(
              title: const Text('SOS'),
              trailing: IconButton(
                onPressed: () {
                  _makePhoneCall('+998 94 294 43 34');
                },
                icon: const Icon(CupertinoIcons.phone),
              ),
            ),
          ],
        ),
      ),
    );
  }
}