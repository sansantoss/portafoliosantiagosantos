import type * as THREENS from 'three';

type Three = typeof THREENS;

/*
  Small drone-ships (the same round design as the one crossing the footer sky) in dogfights: pairs chase
  each other on looping paths and trade laser fire, swapping roles every few seconds. Pure scenery,
  kept away from the planets and the drone's usual routes.
*/
export function createDogfights(THREE: Three, scene: THREENS.Scene, reduce: boolean) {
  const BLUE = new THREE.Color('#8fb0ff');
  const ORANGE = new THREE.Color('#ff8a3d');
  const hull = new THREE.MeshStandardMaterial({ color: 0xb9bec9, metalness: 0.85, roughness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d26, metalness: 0.4, roughness: 0.6 });
  const bodyG = new THREE.SphereGeometry(1, 24, 16);
  const armG = new THREE.CapsuleGeometry(0.28, 1.1, 6, 12);
  const eyeG = new THREE.SphereGeometry(0.42, 16, 12);
  const glowG = new THREE.SphereGeometry(0.3, 12, 8);

  const makeShip = (team: THREENS.Color) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyG, hull);
    const armL = new THREE.Mesh(armG, dark); armL.rotation.x = Math.PI / 2; armL.position.set(-1.25, 0, -0.1);
    const armR = armL.clone(); armR.position.x = 1.25;
    const eye = new THREE.Mesh(eyeG, new THREE.MeshBasicMaterial({ color: team.clone().multiplyScalar(2.2), toneMapped: false }));
    eye.position.set(0, 0, 0.78); eye.scale.set(1, 1, 0.5);
    const engL = new THREE.Mesh(glowG, new THREE.MeshBasicMaterial({ color: team.clone().multiplyScalar(3), toneMapped: false }));
    engL.position.set(-1.25, 0, -0.8);
    const engR = engL.clone(); engR.position.x = 1.25;
    g.add(body, armL, armR, eye, engL, engR);
    g.scale.setScalar(1.3);
    g.userData.color = team;
    scene.add(g);
    return g;
  };

  // three fights: above the disk, below it on the far side, and out past the last planet
  const fights = [
    { c: new THREE.Vector3(-40, 34, -70), a: 46, b: 12, w: 0.42, ph: 0 },
    { c: new THREE.Vector3(90, -30, 40), a: 38, b: 10, w: 0.5, ph: 2.1 },
    { c: new THREE.Vector3(-150, 22, 150), a: 52, b: 14, w: 0.36, ph: 4.2 },
  ].map((f, i) => ({
    ...f,
    ships: [makeShip(i % 2 ? ORANGE : BLUE), makeShip(i % 2 ? BLUE : ORANGE)],
    vel: [new THREE.Vector3(), new THREE.Vector3()],
    lead: 0,
    swapAt: 8 + i * 3,
    cooldown: 0.5,
  }));

  // laser bolts and sparks, pooled
  const boltG = new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6); boltG.rotateX(Math.PI / 2);
  const bolts = Array.from({ length: 40 }, () => {
    const m = new THREE.Mesh(boltG, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.visible = false; scene.add(m);
    return { m, v: new THREE.Vector3(), life: 0, target: null as THREENS.Object3D | null };
  });
  const sparkG = new THREE.SphereGeometry(1, 12, 8);
  const sparks = Array.from({ length: 14 }, () => {
    const m = new THREE.Mesh(sparkG, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd2a0').multiplyScalar(3), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.visible = false; scene.add(m);
    return { m, life: 0 };
  });

  const fire = (from: THREENS.Object3D, to: THREENS.Object3D, color: THREENS.Color) => {
    const b = bolts.find((x) => x.life <= 0);
    if (!b) return;
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(from.quaternion);
    b.m.position.copy(from.position).addScaledVector(dir, 2);
    b.m.quaternion.copy(from.quaternion);
    (b.m.material as THREENS.MeshBasicMaterial).color.copy(color).multiplyScalar(4);
    b.v.copy(dir).multiplyScalar(150);
    b.life = 0.5; b.target = to; b.m.visible = true;
  };
  const spark = (at: THREENS.Vector3) => {
    const s = sparks.find((x) => x.life <= 0);
    if (!s) return;
    s.m.position.copy(at); s.life = 0.35; s.m.visible = true;
  };

  const tmp = new THREE.Vector3(), look = new THREE.Vector3(), aim = new THREE.Vector3();

  return {
    update(dt: number, t: number) {
      const tt = reduce ? t * 0.3 : t;
      for (const f of fights) {
        const L = f.ships[f.lead], C = f.ships[1 - f.lead];
        const vL = f.vel[f.lead], vC = f.vel[1 - f.lead];
        // the leader loops on a figure-eight-ish path
        const w = tt * f.w + f.ph;
        tmp.set(f.c.x + Math.sin(w) * f.a, f.c.y + Math.sin(w * 2.0) * f.b, f.c.z + Math.sin(w * 0.5 + 1.0) * f.a * 0.9);
        vL.copy(tmp).sub(L.position).divideScalar(Math.max(dt, 1e-3));
        if (vL.length() > 80) vL.setLength(80);
        L.position.lerp(tmp, Math.min(1, dt * 6));
        // the chaser steers towards a point just behind the leader
        aim.copy(L.position).addScaledVector(look.copy(vL).normalize(), -9);
        tmp.copy(aim).sub(C.position);
        vC.lerp(tmp.multiplyScalar(2.2), Math.min(1, dt * 2.5));
        if (vC.length() > 85) vC.setLength(85);
        C.position.addScaledVector(vC, dt);
        // face along the velocity, banking into turns
        for (const [s, v] of [[L, vL], [C, vC]] as const) {
          if (v.lengthSq() < 0.01) continue;
          look.copy(s.position).add(v);
          const before = s.quaternion.clone();
          s.lookAt(look);
          s.quaternion.copy(before.slerp(s.quaternion, Math.min(1, dt * 6)));
          s.rotateZ(Math.sin(tt * 1.7 + f.ph) * 0.5);
        }
        if (reduce) continue;
        // fire when lined up
        f.cooldown -= dt;
        const toL = tmp.copy(L.position).sub(C.position).normalize();
        const fwd = look.set(0, 0, 1).applyQuaternion(C.quaternion);
        if (f.cooldown <= 0 && fwd.dot(toL) > 0.94) {
          fire(C, L, C.userData.color as THREENS.Color);
          f.cooldown = 0.18 + Math.random() * 0.6;
        }
        // swap who chases whom
        if (t > f.swapAt) { f.lead = 1 - f.lead; f.swapAt = t + 7 + Math.random() * 6; }
      }
      for (const b of bolts) {
        if (b.life <= 0) continue;
        b.life -= dt;
        b.m.position.addScaledVector(b.v, dt);
        if (b.target && b.m.position.distanceTo(b.target.position) < 2.2) { spark(b.m.position); b.life = 0; }
        if (b.life <= 0) b.m.visible = false;
      }
      for (const s of sparks) {
        if (s.life <= 0) continue;
        s.life -= dt;
        const k = 1 - s.life / 0.35;
        s.m.scale.setScalar(0.3 + k * 2.4);
        (s.m.material as THREENS.MeshBasicMaterial).opacity = 1 - k;
        if (s.life <= 0) s.m.visible = false;
      }
    },
    dispose() {
      [bodyG, armG, eyeG, glowG, boltG, sparkG].forEach((g) => g.dispose());
      hull.dispose(); dark.dispose();
    },
  };
}
