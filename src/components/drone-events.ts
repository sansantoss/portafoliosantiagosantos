'use client';
import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';

/*
  Tiny event bus so any part of the page can talk to the drone without importing three.js.
    droneLook({ x, y })  → the drone turns to look at that point (viewport px); droneLook(null) releases it.
    droneCelebrate()     → back flip.
*/
export type LookTarget = { x: number; y: number } | null;

export function droneLook(target: LookTarget) {
  window.dispatchEvent(new CustomEvent<LookTarget>('drone:look', { detail: target }));
}
export function droneCelebrate() {
  window.dispatchEvent(new Event('drone:celebrate'));
}

/*
  One-shot reactions on top of the Idle loop.
  play('Hit') or play('BackFlip') runs the clip once and then blends back to Idle.
*/
export function createReactions(mixer: AnimationMixer, clips: AnimationClip[], LoopOnce: number) {
  const action = (name: string) => {
    const clip = clips.find((c) => c.name === name);
    return clip ? mixer.clipAction(clip) : null;
  };
  const idle = action('Idle');
  idle?.play();
  let current: AnimationAction | null = null;

  mixer.addEventListener('finished', (e) => {
    if (e.action !== current) return;
    idle?.reset().fadeIn(0.25).play();
    current?.fadeOut(0.25);
    current = null;
  });

  return {
    busy: () => current !== null,
    play(name: 'Hit' | 'BackFlip' | 'Look') {
      const a = action(name);
      if (!a || current === a) return;
      current?.stop();
      current = a;
      a.reset();
      a.setLoop(LoopOnce as never, 1);
      a.clampWhenFinished = true;
      a.fadeIn(0.12).play();
      idle?.fadeOut(0.12);
    },
  };
}

/* Counts clicks: a single tap is a "hit", five quick taps earn a back flip. */
export function createClickCounter(onHit: () => void, onFlip: () => void) {
  let taps: number[] = [];
  return () => {
    const now = performance.now();
    taps = [...taps.filter((t) => now - t < 2500), now];
    if (taps.length >= 5) {
      taps = [];
      onFlip();
    } else {
      onHit();
    }
  };
}
