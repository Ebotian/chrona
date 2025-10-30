/* eslint-disable react/no-unknown-property */
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import Lenis from 'lenis';
import { Leva } from 'leva';
import { Perf } from 'r3f-perf';
import { demoScenes } from './scenes/index.js';
import {
  ReducedMotionProvider,
  ScrollContextProvider,
  useReducedMotionGuard,
} from '@chrono/motion';

const lenis = new Lenis({
  smoothWheel: true,
  duration: 1.2,
});

function useLenisTicker() {
  useReducedMotionGuard();

  useEffect(() => {
    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }

    frame = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(frame);
  }, []);
}

export default function App() {
  const sceneEntries = useMemo(() => Object.entries(demoScenes), []);
  const [sceneKey, setSceneKey] = useState(sceneEntries[0]?.[0] ?? 'nebula');
  const sceneMeta = demoScenes[sceneKey];
  useLenisTicker();

  return (
    <ReducedMotionProvider>
      <ScrollContextProvider lenis={lenis}>
        <div className="app-shell">
          <section className="playground-canvas">
            <Canvas camera={{ position: [0, 0, 12], fov: 45 }} shadows>
              <color attach="background" args={[0.03, 0.04, 0.06]} />
              <ambientLight intensity={0.4} />
              <spotLight position={[6, 12, 15]} angle={0.5} decay={0.4} intensity={5} />
              <Suspense fallback={null}>{sceneMeta?.render()}</Suspense>
              <OrbitControls enableDamping enablePan={false} />
              <Environment preset="night" />
              <Perf position="top-left" minimal />
            </Canvas>
          </section>
          <aside className="playground-panel">
            <header>
              <h1>Chrono Motion Playground</h1>
              <p>
                选择一个 Demo，并使用右下角 Leva 面板调节参数。Lenis 提供滚动驱动输出，视差、粒子
                场和 Shader 的更改会立即反映到场景中。
              </p>
              <div className="badge-grid">
                <div className="badge">
                  <span>滚动引擎</span>
                  <strong>Lenis</strong>
                </div>
                <div className="badge">
                  <span>可视调试</span>
                  <strong>r3f-perf</strong>
                </div>
                <div className="badge">
                  <span>参数面板</span>
                  <strong>Leva</strong>
                </div>
              </div>
            </header>
            <section>
              <h2>可用场景</h2>
              <ul className="inline-list">
                {sceneEntries.map(([key, meta]) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setSceneKey(key)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: sceneKey === key ? '#00f0ff' : 'rgba(197, 200, 209, 0.65)',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      {meta.label}
                    </button>
                  </li>
                ))}
              </ul>
              {sceneMeta ? <p className="scene-description">{sceneMeta.description}</p> : null}
            </section>
          </aside>
          <Leva collapsed titleBar={{ title: 'Chrono Controls' }} />
        </div>
      </ScrollContextProvider>
    </ReducedMotionProvider>
  );
}
