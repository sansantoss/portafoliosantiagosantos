'use client';
import { useEffect, useRef, useState } from 'react';
import { planetFragment, PLANET_VERT } from './planet-shader';
import { HOLE_FRAG, HOLE_VERT, SKY_FRAG, SKY_VERT } from './space-shaders';
import { createDogfights } from './ships';
import { worldFor } from './worlds';

export type PlayProject = {
  slug: string; title: string; summary: string; year: string; category: string; stack: string[];
  featured: boolean; planet: string; moons: number; rings: string; href: string;
};
type Labels = {
  fallback: string;
  title: string; system: string; back: string; open: string; help: string; helpTouch: string; next: string; prev: string;
  worlds: string; hole: string; holeKind: string; holeBody: string; soon: string; boot: string[]; skip: string;
  planet: string; stack: string; enter: string;
};

type Target = { kind: 'planet'; index: number } | { kind: 'hole' } | null;

const hex = (h: string) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255] as const;

/*
  SB-OS, phase 1: the drone flies around a black hole surrounded by the projects, one planet each.
  Fly with WASD / arrows (or the joystick on touch), drag to look around, click a planet to travel
  there. Getting close shows the project's card.
*/
export function SbOs({ projects, labels, home, kinds }: { projects: PlayProject[]; labels: Labels; home: string; kinds: Record<string, string> }) {
  const mount = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [near, setNear] = useState<Target>(null);
  const [touch, setTouch] = useState(false);
  const api = useRef<{ travel: (t: Target) => void; stick: (x: number, y: number) => void } | null>(null);

  // Boot lines, short and skippable.
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setBooting(false), reduce ? 0 : 2100);
    const touchQ = matchMedia('(pointer: coarse)');
    const raf = requestAnimationFrame(() => setTouch(touchQ.matches));
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let stop = () => {};
    let cancelled = false;

    (async () => {
      try {
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
        const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
        const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
        const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js');
        if (cancelled) return;

        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);

        // --- sky + stars ---
        const sky = new THREE.Mesh(
          new THREE.SphereGeometry(1500, 48, 24),
          new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, uniforms: { uTime: { value: 0 } } })
        );
        scene.add(sky);
        // drifting dust near the camera, for a sense of speed (the stars themselves are in the sky shader)
        const dust = (() => {
          const n = 900, pos = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 160, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 160], i * 3);
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          // round, soft dots (the default square points look like pixels up close)
          const c = document.createElement('canvas'); c.width = c.height = 32;
          const cx = c.getContext('2d')!;
          const grd = cx.createRadialGradient(16, 16, 0, 16, 16, 16);
          grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
          cx.fillStyle = grd; cx.fillRect(0, 0, 32, 32);
          const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(c), color: 0x8f9cc8, transparent: true, opacity: 0.5, depthWrite: false }));
          scene.add(pts);
          return { pts, pos, n };
        })();

        const premult = (m: InstanceType<typeof THREE.ShaderMaterial>) => {
          m.transparent = true; m.depthWrite = false;
          m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
          return m;
        };

        // --- black hole (SB-0) ---
        // rs = Schwarzschild radius in world units. Disk from 3 rs (innermost stable orbit) to 13 rs.
        const RS = 5, BOUND = 17;
        const HOLE_R = RS;
        const tiltM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.12, 0, -0.08));
        const basis = new THREE.Matrix3().setFromMatrix4(tiltM.clone().invert());
        const holeMat = premult(new THREE.ShaderMaterial({
          vertexShader: HOLE_VERT, fragmentShader: HOLE_FRAG,
          uniforms: {
            uTime: { value: 0 }, uRs: { value: RS }, uCenter: { value: new THREE.Vector3() }, uBasis: { value: basis },
            uIn: { value: 3 }, uOut: { value: 13 }, uBound: { value: BOUND },
          },
        }));
        holeMat.uniforms.uInvViewProj = { value: new THREE.Matrix4() };
        holeMat.uniforms.uDepth = { value: 0.5 };
        holeMat.depthTest = true;
        const hole = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), holeMat);
        hole.frustumCulled = false;
        scene.add(hole);
        const warm = new THREE.PointLight(0xffb27a, 2.2, 0, 0);
        scene.add(warm);

        // --- planets ---
        const frag = planetFragment();
        const used: Record<string, number> = {};
        const planets = projects.map((p, i) => {
          const variant = (used[p.planet] = (used[p.planet] ?? -1) + 1);
          const w = worldFor(p.slug, p.planet, p.moons, p.rings, p.planet === 'auto' ? 0 : variant);
          const radius = p.featured ? 6.5 : 4.2 + (i % 3) * 0.5;
          const compact = w.rings !== 'none' || w.moons > 0;
          const half = radius / (compact ? 0.42 : 0.62);
          const ringOn = w.rings === 'rings' || w.rings === 'both';
          const beltOn = w.rings === 'belt' || w.rings === 'both';
          const world = w.world;
          const u = {
            uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uSeed: { value: w.seed }, uSpinOffset: { value: 0 },
            uType: { value: world.type },
            uC0: { value: new THREE.Vector3(...hex(world.pal[0])) }, uC1: { value: new THREE.Vector3(...hex(world.pal[1])) },
            uC2: { value: new THREE.Vector3(...hex(world.pal[2])) }, uC3: { value: new THREE.Vector3(...hex(world.pal[3])) },
            uC4: { value: new THREE.Vector3(...hex(world.pal[4])) },
            uSea: { value: world.sea }, uScale: { value: world.scale }, uClouds: { value: world.clouds }, uCloud: { value: new THREE.Vector3(...hex(world.cloud)) },
            uAtmo: { value: new THREE.Vector3(...hex(world.atmo)) }, uAtmoS: { value: world.atmoS }, uCaps: { value: world.caps ?? 0 }, uLights: { value: world.lights ?? 0 },
            uEmit: { value: new THREE.Vector3(...hex(world.emit ?? '#000000')) }, uEmitS: { value: world.emitS ?? 0 },
            uRing: { value: ringOn ? world.ring ?? 0.8 : 0 }, uRingCol: { value: new THREE.Vector3(...hex(world.ringCol ?? '#cfc6b8')) },
            uRingR: { value: new THREE.Vector2(...(world.ringR ?? [1.35, 1.9])) }, uStorm: { value: world.storm ?? 0 },
            uTilt: { value: 0.18 + ((w.seed * 0.6180339) % 1) * 0.35 },
            uLight: { value: new THREE.Vector3(-0.6, 0.3, 0.7) }, uLightCol: { value: new THREE.Vector3(1.25, 1.06, 0.86) }, uMoons: { value: w.moons }, uBelt: { value: beltOn ? 1 : 0 },
            uBeltR: { value: new THREE.Vector2(...(ringOn ? [2.15, 2.6] : [1.45, 2.1])) },
          };
          const mat = premult(new THREE.ShaderMaterial({ vertexShader: PLANET_VERT, fragmentShader: frag, uniforms: u }));
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), mat);
          // a loose spiral around the hole, a little above and below the disk
          const ang = (i / Math.max(1, projects.length)) * Math.PI * 2 + 0.6;
          const dist = 104 + i * 17;
          mesh.position.set(Math.cos(ang) * dist, Math.sin(i * 1.7) * 6, Math.sin(ang) * dist);
          scene.add(mesh);
          return { mesh, u, radius, project: p, world: world.name };
        });

        // --- the drone ---
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        const gltf = await loader.loadAsync('/models/eye-drone.glb');
        if (cancelled) { renderer.dispose(); return; }
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const diameter = bounds.getSize(new THREE.Vector3()).length();
        model.position.sub(bounds.getCenter(new THREE.Vector3()));
        const inner = new THREE.Group(); inner.add(model); inner.scale.setScalar(3.4 / diameter);
        const drone = new THREE.Group(); drone.add(inner); scene.add(drone);
        const mixer = new THREE.AnimationMixer(model);
        const idle = gltf.animations.find((c) => c.name === 'Idle');
        if (idle) mixer.clipAction(idle).play();
        const eyeLight = new THREE.PointLight(0x9fb2ff, 0.6, 30, 1.5);
        drone.add(eyeLight);

        // start beside the first planet, so it is seen half lit with the hole behind it
        const start = new THREE.Vector3(0, 0, 90);
        if (planets[0]) {
          const p0 = planets[0].mesh.position;
          const a0 = Math.atan2(p0.z, p0.x) + 0.32;
          start.set(Math.cos(a0) * (p0.length() + 26), 0, Math.sin(a0) * (p0.length() + 26));
        }
        drone.position.copy(start);
        const vel = new THREE.Vector3();
        let yaw = Math.atan2(-start.x, -start.z);
        let camAz = Math.atan2(start.x, start.z) + 0.25, camEl = 0.2, camDist = 34;

        // --- input ---
        const keys = new Set<string>();
        const stick = { x: 0, y: 0 };
        let target: Target = null;
        let nearRef: Target = null;
        const onKey = (e: KeyboardEvent, down: boolean) => {
          const k = e.key.toLowerCase();
          if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(k)) {
            if (down) { keys.add(k); target = null; } else keys.delete(k);
            if (k.startsWith('arrow') || k === ' ') e.preventDefault();
          }
          if (down && (k === 'e' || k === 'q') && planets.length) {
            const cur = nearRef?.kind === 'planet' ? nearRef.index : -1;
            const n = (cur + (k === 'e' ? 1 : -1) + planets.length) % planets.length;
            target = { kind: 'planet', index: n };
          }
          if (down && k === 'enter' && nearRef?.kind === 'planet') window.location.href = planets[nearRef.index].project.href;
        };
        const kd = (e: KeyboardEvent) => onKey(e, true);
        const ku = (e: KeyboardEvent) => onKey(e, false);
        addEventListener('keydown', kd); addEventListener('keyup', ku);

        // drag to orbit the camera; a click without drag picks a planet
        let dragging = false, moved = 0, lx = 0, ly = 0;
        const canvas = renderer.domElement;
        canvas.style.touchAction = 'none';
        const down = (e: PointerEvent) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); };
        const move = (e: PointerEvent) => {
          if (!dragging) return;
          const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
          camAz -= dx * 0.005; camEl = Math.min(1.1, Math.max(0.08, camEl + dy * 0.004));
        };
        const up = (e: PointerEvent) => {
          dragging = false;
          if (moved > 6) return;
          // pick the planet (or the hole) under the pointer, in screen space
          const rect = canvas.getBoundingClientRect();
          const px = e.clientX - rect.left, py = e.clientY - rect.top;
          let best: Target = null, bd = Infinity;
          const test = (pos: InstanceType<typeof THREE.Vector3>, rad: number, t: Target) => {
            const v = pos.clone().project(camera);
            if (v.z > 1) return;
            const sx = (v.x * 0.5 + 0.5) * rect.width, sy = (-v.y * 0.5 + 0.5) * rect.height;
            const edge = pos.clone().add(new THREE.Vector3(rad, 0, 0).applyQuaternion(camera.quaternion)).project(camera);
            const sr = Math.max(22, Math.abs((edge.x * 0.5 + 0.5) * rect.width - sx));
            const d = Math.hypot(px - sx, py - sy);
            if (d < sr * 1.2 && d < bd) { bd = d; best = t; }
          };
          planets.forEach((p, i) => test(p.mesh.position, p.radius, { kind: 'planet', index: i }));
          test(new THREE.Vector3(), HOLE_R * 3, { kind: 'hole' });
          if (best) target = best;
        };
        const wheel = (e: WheelEvent) => { camDist = Math.min(70, Math.max(14, camDist + e.deltaY * 0.03)); e.preventDefault(); };
        canvas.addEventListener('pointerdown', down);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('wheel', wheel, { passive: false });

        api.current = {
          travel: (t) => { target = t; },
          stick: (x, y) => { stick.x = x; stick.y = y; if (x || y) target = null; },
        };

        // --- labels over the planets (HTML) ---
        const labelBox = labelsRef.current;
        const tags = planets.map((p) => {
          const d = document.createElement('div');
          d.className = 'pl-tag';
          d.innerHTML = `<span>${p.world}</span>${p.project.title.replace(/</g, '&lt;')}`;
          labelBox?.appendChild(d);
          return d;
        });

        // bloom: the disk, the lasers, the city lights and the bright stars glow
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.4, 0.82);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());

        const fights = createDogfights(THREE, scene, reduce);

        const resize = () => {
          const w = el.clientWidth, h = el.clientHeight;
          renderer.setSize(w, h, false);
          composer.setPixelRatio(renderer.getPixelRatio());
          composer.setSize(w, h);
          bloom.resolution.set(w / 2, h / 2);
          camera.aspect = w / h; camera.updateProjectionMatrix();
        };
        resize();
        addEventListener('resize', resize);

        const tmp = new THREE.Vector3(), lightDir = new THREE.Vector3(), camTarget = drone.position.clone();
        let last = performance.now(), t = 0, raf = 0;
        // drop the resolution if the GPU can't keep up (planets are pixel-heavy shaders)
        let ratio = Math.min(devicePixelRatio, 1.6), slow = 0, frames = 0;

        const tick = () => {
          raf = requestAnimationFrame(tick);
          const now = performance.now();
          const raw = (now - last) / 1000;
          const dt = Math.min(0.05, raw); last = now;
          if (++frames > 30) {
            slow = raw > 0.028 ? slow + 1 : Math.max(0, slow - 1);
            if (slow > 20 && ratio > 0.75) { ratio = Math.max(0.75, ratio - 0.25); renderer.setPixelRatio(ratio); resize(); slow = 0; }
          }
          t += reduce ? 0 : dt;

          // input → desired direction, relative to where the camera looks
          let ix = 0, iz = 0;
          if (keys.has('w') || keys.has('arrowup')) iz -= 1;
          if (keys.has('s') || keys.has('arrowdown')) iz += 1;
          if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
          if (keys.has('d') || keys.has('arrowright')) ix += 1;
          ix += stick.x; iz += stick.y;
          const fwd = new THREE.Vector3(-Math.sin(camAz), 0, -Math.cos(camAz));
          const right = new THREE.Vector3(Math.cos(camAz), 0, -Math.sin(camAz));
          const want = new THREE.Vector3().addScaledVector(right, ix).addScaledVector(fwd, -iz);
          let speed = keys.has('shift') || keys.has(' ') ? 46 : 26;

          // autopilot towards a planet or the hole
          if (target && !want.lengthSq()) {
            const goal = target.kind === 'planet' ? planets[target.index].mesh.position : new THREE.Vector3();
            const stopAt = target.kind === 'planet' ? planets[target.index].radius * 2.6 + 6 : HOLE_R * 11;
            tmp.copy(goal).sub(drone.position);
            const d = tmp.length();
            if (d > stopAt) {
              want.copy(tmp).normalize();
              // steer around the black hole instead of flying through it
              const toHole = drone.position.clone().negate();
              const along = toHole.dot(want);
              const miss = toHole.clone().addScaledVector(want, -along).length();
              if (target.kind === 'planet' && along > 0 && along < d && miss < HOLE_R * 12) {
                const side = new THREE.Vector3(want.z, 0, -want.x);
                if (side.dot(toHole) > 0) side.negate();
                want.addScaledVector(side, 1.2).normalize();
              }
              speed = Math.min(60, 10 + (d - stopAt) * 1.2);
            } else target = null;
          }
          if (want.lengthSq() > 1) want.normalize();
          vel.lerp(want.multiplyScalar(speed), 1 - Math.exp(-dt * 2.6));
          drone.position.addScaledVector(vel, dt);

          // keep out of the planets and the horizon
          planets.forEach((p) => {
            tmp.copy(drone.position).sub(p.mesh.position);
            const minD = p.radius + 3;
            if (tmp.length() < minD) drone.position.copy(p.mesh.position).addScaledVector(tmp.normalize(), minD);
          });
          if (drone.position.length() < HOLE_R * 3.6) drone.position.setLength(HOLE_R * 3.6);
          drone.position.y += (0 - drone.position.y) * dt * 0.5;
          const maxR = 330;
          if (drone.position.length() > maxR) drone.position.setLength(maxR);

          // face where it is going; bob a little
          if (vel.lengthSq() > 0.5) {
            const wantYaw = Math.atan2(vel.x, vel.z);
            let dy = wantYaw - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
            yaw += dy * (1 - Math.exp(-dt * 5));
          }
          drone.rotation.set(-Math.min(0.35, vel.length() * 0.008), yaw, 0);
          inner.position.y = reduce ? 0 : Math.sin(t * 1.6) * 0.25;
          mixer.update(dt);

          // camera follows from behind and above
          camTarget.lerp(drone.position, 1 - Math.exp(-dt * 4));
          camera.position.set(
            camTarget.x + Math.sin(camAz) * Math.cos(camEl) * camDist,
            camTarget.y + Math.sin(camEl) * camDist,
            camTarget.z + Math.cos(camAz) * Math.cos(camEl) * camDist
          );
          camera.lookAt(camTarget);
          camera.updateMatrixWorld();

          // billboards face the camera; planets are lit by the hole's disk
          holeMat.uniforms.uTime.value = t;
          holeMat.uniforms.uInvViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert();
          tmp.set(0, 0, 0).project(camera);
          holeMat.uniforms.uDepth.value = Math.min(0.9999, Math.max(0, tmp.z * 0.5 + 0.5));
          const holeDist = camera.position.length();
          hole.renderOrder = 0;
          (sky as InstanceType<typeof THREE.Mesh>).renderOrder = -2;
          (sky.material as InstanceType<typeof THREE.ShaderMaterial>).uniforms.uTime.value = t;
          let closest: Target = null, cd = Infinity;
          planets.forEach((p, i) => {
            p.mesh.quaternion.copy(camera.quaternion);
            p.mesh.renderOrder = camera.position.distanceTo(p.mesh.position) > holeDist ? -1 : 1;
            p.u.uTime.value = t;
            lightDir.copy(p.mesh.position).negate().normalize().transformDirection(camera.matrixWorldInverse);
            lightDir.z = Math.max(lightDir.z, -0.6); // keep a sliver of light so no planet is a black disc
            p.u.uLight.value.copy(lightDir.normalize());
            const d = drone.position.distanceTo(p.mesh.position);
            if (d < p.radius * 3 + 14 && d < cd) { cd = d; closest = { kind: 'planet', index: i }; }
            // label
            const tag = tags[i];
            tmp.copy(p.mesh.position); tmp.y += p.radius * 1.25;
            tmp.project(camera);
            if (tmp.z > 1 || Math.abs(tmp.x) > 1.2 || Math.abs(tmp.y) > 1.2) { tag.style.opacity = '0'; return; }
            tag.style.opacity = '1';
            tag.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * el.clientWidth}px, ${(-tmp.y * 0.5 + 0.5) * el.clientHeight}px) translate(-50%, -100%)`;
          });
          if (!closest && drone.position.length() < HOLE_R * 15) closest = { kind: 'hole' };
          const changed = JSON.stringify(closest) !== JSON.stringify(nearRef);
          if (changed) { nearRef = closest; setNear(closest); }

          // dust wraps around the camera
          for (let i = 0; i < dust.n; i++) {
            for (let k = 0; k < 3; k++) {
              const span = k === 1 ? 80 : 160;
              let v = dust.pos[i * 3 + k] - camTarget.getComponent(k);
              v = ((v + span / 2) % span + span) % span - span / 2;
              dust.pos[i * 3 + k] = camTarget.getComponent(k) + v;
            }
          }
          dust.pts.geometry.attributes.position.needsUpdate = true;

          fights.update(dt, t);
          composer.render();
        };
        tick();
        setReady(true);

        stop = () => {
          cancelAnimationFrame(raf);
          removeEventListener('resize', resize); removeEventListener('keydown', kd); removeEventListener('keyup', ku);
          canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
          canvas.removeEventListener('pointerup', up); canvas.removeEventListener('wheel', wheel);
          tags.forEach((d) => d.remove());
          fights.dispose(); composer.dispose(); renderer.dispose(); pmrem.dispose();
          canvas.remove();
        };
      } catch (err) {
        console.warn('SB-OS could not start', err);
        setFailed(true);
      }
    })();

    return () => { cancelled = true; stop(); };
  }, [projects]);

  // joystick (touch)
  const stickRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const onStick = (e: React.PointerEvent) => {
    const r = stickRef.current!.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    setKnob({ x, y });
    api.current?.stick(x, y);
  };
  const endStick = () => { setKnob({ x: 0, y: 0 }); api.current?.stick(0, 0); };

  const card = near?.kind === 'planet' ? projects[near.index] : null;

  return (
    <div className="sbos" data-ready={ready}>
      <div className="sbos-canvas" ref={mount} />
      <div className="sbos-labels" ref={labelsRef} aria-hidden="true" />

      <header className="sbos-top">
        <span className="sbos-brand"><b>{labels.title}</b> · {labels.system}</span>
        <a className="sbos-back" href={home}>← {labels.back}</a>
      </header>

      <nav className="sbos-worlds" aria-label={labels.worlds}>
        {projects.map((p, i) => (
          <button key={p.slug} type="button" className={near?.kind === 'planet' && near.index === i ? 'on' : ''} onClick={() => api.current?.travel({ kind: 'planet', index: i })}>
            {p.title}
          </button>
        ))}
        <button type="button" className={near?.kind === 'hole' ? 'on' : ''} onClick={() => api.current?.travel({ kind: 'hole' })}>{labels.hole}</button>
      </nav>

      {card && (
        <aside className="sbos-card" aria-live="polite">
          <span className="sbos-kind">{kinds[card.category] ?? card.category}{card.year ? ` · ${card.year}` : ''}</span>
          <h2>{card.title}</h2>
          <p>{card.summary}</p>
          {card.stack.length > 0 && <ul>{card.stack.slice(0, 6).map((s) => <li key={s}>{s}</li>)}</ul>}
          <a href={card.href} className="sbos-open">{labels.open} →</a>
        </aside>
      )}
      {near?.kind === 'hole' && (
        <aside className="sbos-card" aria-live="polite">
          <span className="sbos-kind">{labels.holeKind} · {labels.soon}</span>
          <h2>{labels.hole}</h2>
          <p>{labels.holeBody}</p>
        </aside>
      )}

      {!touch ? (
        <p className="sbos-help">{labels.help} · Q / E · Enter</p>
      ) : (
        <>
          <p className="sbos-help">{labels.helpTouch}</p>
          <div
            className="sbos-stick"
            ref={stickRef}
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); onStick(e); }}
            onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') onStick(e); }}
            onPointerUp={endStick}
            onPointerCancel={endStick}
            aria-hidden="true"
          >
            <span style={{ transform: `translate(${knob.x * 28}px, ${knob.y * 28}px)` }} />
          </div>
        </>
      )}

      {(booting || !ready) && !failed && (
        <div className="sbos-boot" onClick={() => setBooting(false)}>
          <div>
            {labels.boot.map((l, i) => <p key={l} style={{ animationDelay: `${i * 0.45}s` }}>&gt; {l}</p>)}
          </div>
          <button type="button" onClick={() => setBooting(false)}>{labels.skip}</button>
        </div>
      )}
      {failed && (
        <div className="sbos-fallback">
          <p>{labels.fallback}</p>
          <ul>
            {projects.map((p) => (
              <li key={p.slug}><a href={p.href}>{p.title}</a> <span>{worldFor(p.slug, p.planet).world.name}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
