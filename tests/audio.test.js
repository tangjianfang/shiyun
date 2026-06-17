import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAudio, play, pause, stop, setSpeed, getCurrentTime, setOnEnd } from '../src/js/audio.js';

describe('audio', () => {
  let mockAudioInstances;

  beforeEach(() => {
    mockAudioInstances = [];
    global.Audio = vi.fn(function(src) {
      this.src = src;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.load = vi.fn();
      this.currentTime = 0;
      this.playbackRate = 1;
      mockAudioInstances.push(this);
    });
  });

  it('createAudio 应创建 Audio 元素', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    expect(global.Audio).toHaveBeenCalledWith('data:audio/mp3;base64,xxx');
  });

  it('play 应调用 audio.play()', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    play(audio);
    expect(audio.play).toHaveBeenCalled();
  });

  it('pause 应调用 audio.pause()', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    pause(audio);
    expect(audio.pause).toHaveBeenCalled();
  });

  it('setSpeed 应设置 playbackRate', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    setSpeed(audio, 0.5);
    expect(audio.playbackRate).toBe(0.5);
  });

  it('setSpeed 应限制在 0.25-2.0', () => {
    const audio = createAudio('xxx');
    setSpeed(audio, 5);
    expect(audio.playbackRate).toBe(2.0);
    setSpeed(audio, 0.1);
    expect(audio.playbackRate).toBe(0.25);
  });

  it('setOnEnd 应注册 ended 事件回调', () => {
    const audio = createAudio('xxx');
    const cb = vi.fn();
    setOnEnd(audio, cb);
    audio.onended();
    expect(cb).toHaveBeenCalled();
  });

  it('stop 应暂停并重置 currentTime', () => {
    const audio = createAudio('xxx');
    audio.currentTime = 10;
    stop(audio);
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
  });

  it('getCurrentTime 返回 audio.currentTime', () => {
    const audio = createAudio('xxx');
    audio.currentTime = 5;
    expect(getCurrentTime(audio)).toBe(5);
  });

  it('null audio 不应抛错', () => {
    expect(() => play(null)).not.toThrow();
    expect(() => pause(null)).not.toThrow();
    expect(() => stop(null)).not.toThrow();
  });
});
