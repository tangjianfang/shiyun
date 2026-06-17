/**
 * 音频播放封装
 * - 基于原生 HTMLAudioElement（new Audio()）
 * - 支持 base64 data URL 播放
 * - 支持倍速控制（朗读/慢速/跟读）
 */

export function createAudio(src) {
  return new Audio(src);
}

export function play(audio) {
  if (!audio) return Promise.resolve();
  return audio.play();
}

export function pause(audio) {
  if (audio) audio.pause();
}

export function stop(audio) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

export function setSpeed(audio, speed) {
  if (!audio) return;
  audio.playbackRate = Math.max(0.25, Math.min(2.0, speed));
}

export function getCurrentTime(audio) {
  return audio ? audio.currentTime : 0;
}

export function setOnEnd(audio, callback) {
  if (!audio) return;
  audio.onended = callback;
}

export function setOnProgress(audio, callback) {
  if (!audio) return;
  audio.ontimeupdate = callback;
}
