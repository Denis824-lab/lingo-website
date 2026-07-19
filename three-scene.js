import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#linmo-orb");
const host = canvas?.parentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && host) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.3);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const group = new THREE.Group();
  group.rotation.z = -0.12;
  scene.add(group);

  const knotGeometry = new THREE.TorusKnotGeometry(1.64, 0.34, 240, 28, 2, 3);
  const knotMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8b5cff,
    emissive: 0x321266,
    emissiveIntensity: 1.9,
    metalness: 0.54,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    iridescence: 1,
    iridescenceIOR: 1.55,
    iridescenceThicknessRange: [180, 760],
  });
  const knot = new THREE.Mesh(knotGeometry, knotMaterial);
  group.add(knot);

  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.65, 2), 18),
    new THREE.LineBasicMaterial({ color: 0xd8ff5f, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending })
  );
  group.add(wire);

  const starCount = 900;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const palette = [new THREE.Color(0xd8ff5f), new THREE.Color(0xff6b45), new THREE.Color(0x8b5cff), new THREE.Color(0xffffff)];
  for (let i = 0; i < starCount; i += 1) {
    const radius = 2.55 + Math.random() * 1.25;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(stars);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b45, transparent: true, opacity: 0.17, blending: THREE.AdditiveBlending });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.008, 8, 190), ringMaterial);
  ring.rotation.set(1.1, 0.3, 0.2);
  group.add(ring);

  scene.add(new THREE.HemisphereLight(0xb9c7ff, 0x180916, 1.8));
  const key = new THREE.PointLight(0xd8ff5f, 85, 13, 2); key.position.set(3.2, 3.3, 4.2); scene.add(key);
  const rim = new THREE.PointLight(0xff4e35, 95, 12, 2); rim.position.set(-3.8, -1.5, 2.8); scene.add(rim);
  const violet = new THREE.PointLight(0x7954ff, 110, 13, 2); violet.position.set(0, 1, -3); scene.add(violet);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.3;
  controls.maxPolarAngle = Math.PI * 0.7;

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  let frame = 0;
  const clock = new THREE.Clock();
  const animate = () => {
    const time = clock.getElapsedTime();
    controls.update();
    if (!controls.state && !reducedMotion) group.rotation.y = time * 0.08;
    knot.rotation.x = time * 0.08;
    knot.rotation.y = time * 0.14;
    wire.rotation.y = -time * 0.05;
    wire.rotation.x = time * 0.025;
    stars.rotation.y = time * 0.018;
    ring.rotation.z = time * 0.07;
    knot.position.y = Math.sin(time * 0.8) * 0.08;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  if (reducedMotion) renderer.render(scene, camera); else animate();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else if (!document.hidden && !frame && !reducedMotion) animate();
  });
}
