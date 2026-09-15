import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:audioplayers/audioplayers.dart';

/// Global singleton instance, initialized in [main] via [AudioService.init].
late AudioPlayerHandler audioHandler;

class AudioPlayerHandler extends BaseAudioHandler with SeekHandler {
  final AudioPlayer _player = AudioPlayer();

  // StreamSubscriptions stored so they can be cancelled on [stop].
  late final StreamSubscription<PlayerState> _stateSub;
  late final StreamSubscription<Duration> _positionSub;
  late final StreamSubscription<Duration> _durationSub;

  AudioPlayer get player => _player;

  AudioPlayerHandler({
    String? filePath,
    String? title,
    String? artist,
    String? album,
    Uri? artUri,
  }) {
    if (filePath != null) {
      final mediaItemInstance = MediaItem(
        id: filePath,
        album: album ?? 'Expenses Audio',
        title: title ?? 'Audio Track',
        artist: artist ?? 'Unknown Artist',
        artUri: artUri,
      );
      mediaItem.add(mediaItemInstance);
      _player.setSource(DeviceFileSource(filePath));
    }

    // Listen to state changes — store subscriptions for later cancellation.
    _stateSub = _player.onPlayerStateChanged.listen((state) {
      playbackState.add(_transformEvent(state));
    });

    _positionSub = _player.onPositionChanged.listen((pos) {
      playbackState.add(playbackState.value.copyWith(updatePosition: pos));
    });

    _durationSub = _player.onDurationChanged.listen((dur) {
      if (mediaItem.value != null) {
        mediaItem.add(mediaItem.value!.copyWith(duration: dur));
      }
    });
  }

  Future<void> playFile({
    required String filePath,
    String? title,
    String? artist,
    String? album,
    Uri? artUri,
  }) => playFromFile(
    filePath: filePath,
    title: title,
    artist: artist,
    album: album,
    artUri: artUri,
  );

  Future<void> playFromFile({
    required String filePath,
    String? title,
    String? artist,
    String? album,
    Uri? artUri,
  }) async {
    final mediaItemInstance = MediaItem(
      id: filePath,
      album: album ?? 'Expenses Audio',
      title: title ?? filePath.split('/').last,
      artist: artist ?? 'Unknown Artist',
      artUri: artUri,
    );
    mediaItem.add(mediaItemInstance);
    await _player.setSource(DeviceFileSource(filePath));
    await _player.resume();
  }

  @override
  Future<void> playMediaItem(MediaItem mediaItem) async {
    this.mediaItem.add(mediaItem);
    await _player.setSource(DeviceFileSource(mediaItem.id));
    await _player.resume();
  }

  @override
  Future<void> play() => _player.resume();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> seek(Duration position) async {
    await _player.seek(position);
    playbackState.add(playbackState.value.copyWith(updatePosition: position));
  }

  @override
  Future<void> stop() async {
    await _player.stop();
    await _stateSub.cancel();
    await _positionSub.cancel();
    await _durationSub.cancel();
    await _player.dispose();
    await super.stop();
  }

  /// Transform an audioplayers PlayerState event into an audio_service state.
  PlaybackState _transformEvent(PlayerState state) {
    return PlaybackState(
      controls: [
        MediaControl.rewind,
        if (state == PlayerState.playing)
          MediaControl.pause
        else
          MediaControl.play,
        MediaControl.stop,
        MediaControl.fastForward,
      ],
      systemActions: const {
        MediaAction.seek,
        MediaAction.seekForward,
        MediaAction.seekBackward,
      },
      androidCompactActionIndices: const [0, 1, 3],
      processingState:
          const {
            PlayerState.stopped: AudioProcessingState.idle,
            PlayerState.completed: AudioProcessingState.completed,
            PlayerState.playing: AudioProcessingState.ready,
            PlayerState.paused: AudioProcessingState.ready,
          }[state] ??
          AudioProcessingState.idle,
      playing: state == PlayerState.playing,
      updatePosition: Duration.zero,
      bufferedPosition: Duration.zero,
      speed: 1.0,
    );
  }
}
