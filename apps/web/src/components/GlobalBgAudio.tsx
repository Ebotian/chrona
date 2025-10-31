'use client';

import { useEffect, useRef, useState } from 'react';

export default function GlobalBgAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // Try to autoplay once. Browsers often block autoplay until user interaction.
    const tryPlay = async () => {
      try {
        await el.play();
        setPlaying(true);
      } catch (e) {
        // Autoplay blocked — we'll wait for the first user interaction.
      }
    };

    tryPlay();

    const onFirstInteract = async () => {
      tryPlay();
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
    };

    window.addEventListener('pointerdown', onFirstInteract);
    window.addEventListener('keydown', onFirstInteract);

    return () => {
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 9999 }}>
      <audio ref={audioRef} src="/resources/cnverter.mp3" loop preload="auto" />
      <button
        aria-label="背景音乐 开关"
        onClick={async () => {
          const el = audioRef.current;
          if (!el) return;
          if (el.paused) {
            try {
              await el.play();
              setPlaying(true);
            } catch (e) {
              /* ignored */
            }
          } else {
            el.pause();
            setPlaying(false);
          }
        }}
        style={{ padding: '6px 8px', borderRadius: 6 }}
      >
        {playing ? '⏸' : '▶️'}
      </button>
    </div>
  );
}
