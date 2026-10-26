'use client';
import { useEffect, useRef } from 'react';

/*
  The drone that rides along the home page (desktop only).
  - Starts parked in the empty space of the hero ([data-dock="start"]).
  - While you scroll it follows the middle of the screen, flying in the right-hand margin.
    When the margin is too narrow for it, it fades out in transit instead of covering text.
  - Parks next to "Ask my CV" ([data-dock="end"]), as the assistant-to-be.
  three.js and the model only load on screens wide enough to show it.
*/
const MIN_WIDTH = 1180; // below this the docks are hidden and nothing loads
const MIN_GUTTER = 84; // px of free margin needed to fly beside the content

export function ScrollDrone() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || window.innerWidth < MIN_WIDTH) return;
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

        // Orthographic camera in CSS pixels: x right, y down (we negate y when placing).
        const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000);

        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        const gltf = await loader.loadAsync('/models/eye-drone.glb');
        if (cancelled) { renderer.dispose(); return; }

        // Normalise the model to a 1-unit diameter so we can size it in pixels.
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const diameter = bounds.getSize(new THREE.Vector3()).length();
        model.position.sub(bounds.getCenter(new THREE.Vector3()));
        const inner = new THREE.Group();
        inner.add(model);
        inner.scale.setScalar(1 / diameter);
        const pivot = new THREE.Group();
        pivot.add(inner);
        scene.add(pivot);

        const mixer = new THREE.AnimationMixer(model);
        const idle = gltf.animations.find((a) => a.name === 'Idle');
        if (idle && !reduce) mixer.clipAction(idle).play();
        else mixer.update(0.5);

        let vw = 0, vh = 0;
        const resize = () => {
          vw = window.innerWidth;
          vh = window.innerHeight;
          renderer.setSize(vw, vh, false);
          camera.right = vw;
          camera.bottom = -vh;
          camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener('resize', resize);

        const mouse = { x: 0, y: 0 };
        const onMove = (e: PointerEvent) => {
          mouse.x = (e.clientX / vw) * 2 - 1;
          mouse.y = (e.clientY / vh) * 2 - 1;
        };
        if (finePointer && !reduce) window.addEventListener('pointermove', onMove);

        const startDock = document.querySelector<HTMLElement>('[data-dock="start"]');
        const endDock = document.querySelector<HTMLElement>('[data-dock="end"]');
        const wrap = document.querySelector<HTMLElement>('.wrap');
        if (!startDock || !endDock) throw new Error('docks missing');
        if (!endDock.offsetWidth) throw new Error('end dock hidden');

        const docRect = (n: HTMLElement) => {
          const r = n.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY, size: Math.min(r.width, r.height) };
        };
        const smooth = (t: number) => t * t * (3 - 2 * t);
        const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
        const mix = (a: number, b: number, t: number) => a + (b - a) * t;

        // current (smoothed) state
        const cur = { x: 0, y: 0, size: 0, opacity: 0 };
        let first = true;
        let last = performance.now();
        let raf = 0;

        const tick = () => {
          raf = requestAnimationFrame(tick);
          if (vw < MIN_WIDTH) { el.style.opacity = '0'; return; }

          const s = docRect(startDock);
          const e = docRect(endDock);
          const pad = wrap ? wrap.getBoundingClientRect().left + 24 : 0; // free margin beside content
          const canFly = pad >= MIN_GUTTER && !reduce;
          const flySize = Math.min(pad * 0.8, 120);
          const flyX = vw - pad / 2;

          // Where the drone wants to be, in document coordinates.
          const ride = window.scrollY + vh * 0.5;
          const docY = Math.min(Math.max(ride, s.y), e.y);
          const p = clamp01((docY - s.y) / (e.y - s.y)); // 0 = hero, 1 = Ask my CV
          const outT = smooth(clamp01(p / 0.06)); // leaving the hero dock
          const inT = smooth(clamp01((p - 0.9) / 0.1)); // arriving at the end dock

          let tx: number, size: number, opacity = 1;
          if (p < 0.5) {
            tx = mix(s.x, flyX, outT);
            size = mix(s.size, flySize, outT);
            if (!canFly) opacity = 1 - outT;
          } else {
            tx = mix(flyX, e.x, inT);
            size = mix(flySize, e.size, inT);
            if (!canFly) opacity = inT;
          }
          const ty = docY - window.scrollY; // back to viewport coordinates

          const k = first || reduce ? 1 : 0.09; // easing toward the target = floaty inertia
          first = false;
          const vy = (ty - cur.y);
          cur.x += (tx - cur.x) * k;
          cur.y += (ty - cur.y) * k;
          cur.size += (size - cur.size) * k;
          cur.opacity += (opacity - cur.opacity) * (reduce ? 1 : 0.12);

          const onScreen = cur.y > -cur.size && cur.y < vh + cur.size && cur.opacity > 0.01;
          el.style.opacity = String(cur.opacity);
          if (!onScreen) return;

          const now = performance.now();
          mixer.update(Math.min((now - last) / 1000, 0.05));
          last = now;
          pivot.position.set(cur.x, -cur.y, 0);
          pivot.scale.setScalar(cur.size);
          // Look toward the content (to its left), tilt with the motion, glance at the cursor.
          const lookY = -0.55 + mouse.x * 0.35;
          const lookX = 0.1 + mouse.y * 0.25 + THREE.MathUtils.clamp(vy * 0.004, -0.35, 0.35);
          pivot.rotation.y += (lookY - pivot.rotation.y) * 0.08;
          pivot.rotation.x += (lookX - pivot.rotation.x) * 0.08;
          renderer.render(scene, camera);
        };
        tick();
        document.documentElement.classList.add('drone-3d');

        stop = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('resize', resize);
          window.removeEventListener('pointermove', onMove);
          renderer.dispose();
          pmrem.dispose();
          renderer.domElement.remove();
          document.documentElement.classList.remove('drone-3d');
        };
      } catch (err) {
        // No WebGL (or docks hidden): the static image in the docks stays visible.
        console.warn('[drone] 3D unavailable, showing image instead:', err);
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return <div ref={box} className="scroll-drone" aria-hidden="true" />;
}
