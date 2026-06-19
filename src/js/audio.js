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

/** 创建并立即播放音频，返回 audio 实例（quiz 使用） */
export function audioPlay(src) {
  const audio = createAudio(src);
  play(audio);
  return audio;
}

// ══════════════════════════════
// Web Speech API TTS 兜底
// ══════════════════════════════

/** 浏览器是否支持 speechSynthesis */
export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * 创建 SpeechSynthesisUtterance，用于诗词朗读
 * @param {string[]} lines  诗词正文行数组
 * @param {{rate?:number}} opts
 */
export function createSpeech(lines, { rate = 1 } = {}) {
  const text = Array.isArray(lines) ? lines.join('，') : String(lines);
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = Math.max(0.5, Math.min(2, rate));
  return u;
}

/** 开始朗读（先取消当前） */
export function speak(utt) {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

/** 停止朗读 */
export function stopSpeak() {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
}

/** 暂停朗读 */
export function pauseSpeak() {
  if (!speechSupported()) return;
  window.speechSynthesis.pause();
}

/** 恢复朗读 */
export function resumeSpeak() {
  if (!speechSupported()) return;
  window.speechSynthesis.resume();
}
