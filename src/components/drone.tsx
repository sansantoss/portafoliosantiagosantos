'use client';
import { useEffect, useRef, useState } from 'react';
import { createClickCounter, createReactions } from './drone-events';

// Eye Drone by Quaternius (CC0), eye recoloured to the site accent.
// three.js is imported only when this component mounts, so it never weighs on other pages.
export function Drone() {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let stop = () => {};
    let cancelled = false;

    (async () => {
      try {
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (cancelled) return;

        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finePointer = matchMedia('(pointer: fine)').matches;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);

        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        const gltf = await loader.loadAsync('/models/eye-drone.glb');
        if (cancelled) { renderer.dispose(); return; }

        const pivot = new THREE.Group();
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3()).length();
        model.position.sub(center);
        pivot.add(model);
        scene.add(pivot);
        camera.position.set(0, size * 0.05, size * 1.8);
        camera.lookAt(0, 0, 0);

        const mixer = new THREE.AnimationMixer(model);
        const reactions = reduce ? null : createReactions(mixer, gltf.animations, THREE.LoopOnce);
        const tap = createClickCounter(() => reactions?.play('Hit'), () => reactions?.play('BackFlip'));
        el.addEventListener('pointerdown', tap);
        const onCelebrate = () => reactions?.play('BackFlip');
        window.addEventListener('drone:celebrate', onCelebrate);

        const resize = () => {
          const { width, height } = el.getBoundingClientRect();
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        // The eye follows the cursor on devices with a mouse.
        const target = { x: 0, y: 0 };
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          target.x = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
          target.y = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
        };
        if (finePointer && !reduce) window.addEventListener('pointermove', onMove);

        let visible = true;
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
        io.observe(el);

        let last = performance.now();
        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          if (!visible) return;
          const now = performance.now();
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          mixer.update(dt);
          pivot.rotation.y += (target.x * 0.7 - pivot.rotation.y) * 0.06;
          pivot.rotation.x += (target.y * 0.45 - pivot.rotation.x) * 0.06;
          renderer.render(scene, camera);
        };
        if (reduce) {
          mixer.update(0.5);
          renderer.render(scene, camera);
        } else {
          tick();
        }
        el.dataset.ready = 'true';

        stop = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('drone:celebrate', onCelebrate);
          el.removeEventListener('pointerdown', tap);
          ro.disconnect();
          io.disconnect();
          renderer.dispose();
          pmrem.dispose();
          renderer.domElement.remove();
        };
      } catch (err) {
        console.warn('[drone] 3D unavailable, showing image instead:', err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return (
    <div ref={box} className={`drone${failed ? ' failed' : ''}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="drone-poster" src="/models/eye-drone.webp" alt="" />
    </div>
  );
}
