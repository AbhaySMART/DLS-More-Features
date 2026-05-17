import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#worldCanvas");
const stage = document.querySelector(".sim-stage");
const labelsLayer = document.querySelector("#scienceLabels");
const lawButtons = document.querySelectorAll("#simLawList button");
const slider = document.querySelector("#lawSlider");
const sliderLabel = document.querySelector("#sliderLabel");
const promptForm = document.querySelector("#whatIfForm");
const promptInput = document.querySelector("#whatIfInput");
const exampleButtons = document.querySelectorAll(".prompt-examples button");
const analysisStack = document.querySelector("#analysisStack p");
const worldBadge = document.querySelector("#worldBadge");
const worldTitle = document.querySelector("#worldTitle");
const explainTitle = document.querySelector("#explainTitle");
const explainCopy = document.querySelector("#explainCopy");
const resetButton = document.querySelector("#resetSim");
const metricOne = document.querySelector("#metricOne");
const metricTwo = document.querySelector("#metricTwo");
const metricThree = document.querySelector("#metricThree");
const metricOneValue = document.querySelector("#metricOneValue");
const metricTwoValue = document.querySelector("#metricTwoValue");
const metricThreeValue = document.querySelector("#metricThreeValue");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfefff);
scene.fog = new THREE.FogExp2(0xcfefff, 0.013);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 420);
camera.position.set(78, 62, 86);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 8, 0);
controls.maxPolarAngle = Math.PI * 0.48;

const ambient = new THREE.HemisphereLight(0xffffff, 0x4b5563, 1.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff4dd, 4.2);
sun.position.set(42, 62, 26);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -72;
sun.shadow.camera.right = 72;
sun.shadow.camera.top = 72;
sun.shadow.camera.bottom = -72;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const buildings = [];
const cars = [];
const trees = [];
const people = [];
const steamPuffs = [];
const rainDrops = [];
const scienceAnchors = {};
const scienceArrows = {};
const pedestrianPaths = [
  { orientation: "x", z: 7.4, from: -48, to: 48, x: 0 },
  { orientation: "x", z: -7.4, from: -48, to: 48, x: 0 },
  { orientation: "x", z: 33.4, from: -48, to: 48, x: 0 },
  { orientation: "x", z: -33.4, from: -48, to: 48, x: 0 },
  { orientation: "z", x: 7.4, from: -38, to: 38, z: 0 },
  { orientation: "z", x: -7.4, from: -38, to: 38, z: 0 },
  { orientation: "z", x: 37.4, from: -38, to: 38, z: 0 },
  { orientation: "z", x: -37.4, from: -38, to: 38, z: 0 },
  { orientation: "x", z: 36.2, from: -52, to: -31, x: 0 },
  { orientation: "z", x: 42, from: 22, to: 39, z: 0 }
];

let activeSliderLaw = "gravity";
let simState = defaultState();

function defaultState() {
  return {
    prompt: "What if gravity became 2x stronger?",
    gravity: 2,
    oxygen: 21,
    friction: 1,
    humanScale: 1,
    boilingPoint: 212,
    atmosphere: 1,
    temperatureF: 72,
    acidity: 0,
    wind: 0,
    earthquake: 0
  };
}

function makeTexture(draw, size = 512) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const textureCtx = textureCanvas.getContext("2d");
  draw(textureCtx, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

const asphaltTexture = makeTexture((ctx, size) => {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i += 1) {
    const shade = 18 + Math.random() * 45;
    ctx.fillStyle = `rgba(${shade}, ${shade + 5}, ${shade + 12}, ${Math.random() * 0.5})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
});
asphaltTexture.repeat.set(12, 8);

const grassTexture = makeTexture((ctx, size) => {
  ctx.fillStyle = "#70c77a";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i += 1) {
    ctx.strokeStyle = `rgba(${60 + Math.random() * 45}, ${110 + Math.random() * 90}, ${50 + Math.random() * 45}, 0.35)`;
    ctx.beginPath();
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.random() * 8 - 4, y + Math.random() * 8);
    ctx.stroke();
  }
});
grassTexture.repeat.set(18, 14);

const windowTexture = makeTexture((ctx, size) => {
  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(0, 0, size, size);
  for (let y = 18; y < size; y += 52) {
    for (let x = 18; x < size; x += 48) {
      const lit = Math.random() > 0.34;
      ctx.fillStyle = lit ? "#fef3c7" : "#1e3a5f";
      ctx.fillRect(x, y, 26, 28);
    }
  }
});
windowTexture.repeat.set(1, 3);

const materials = {
  grass: new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.95 }),
  asphalt: new THREE.MeshStandardMaterial({ map: asphaltTexture, color: 0x05070d, roughness: 0.92 }),
  asphaltPlain: new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.96 }),
  stripe: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.9 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xb8c2cc, roughness: 0.78, metalness: 0.04 }),
  glass: new THREE.MeshStandardMaterial({ map: windowTexture, color: 0xb8d8ff, roughness: 0.22, metalness: 0.15 }),
  water: new THREE.MeshPhysicalMaterial({
    color: 0x35bdf2,
    roughness: 0.08,
    transmission: 0.25,
    transparent: true,
    opacity: 0.76
  }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.88 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x17934c, roughness: 0.82 }),
  steam: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, depthWrite: false }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd6a77a, roughness: 0.72 }),
  flame: new THREE.MeshStandardMaterial({ color: 0xff7a18, emissive: 0xff5d00, emissiveIntensity: 1.8 }),
  vectorGravity: new THREE.MeshBasicMaterial({ color: 0xff7a18 }),
  vectorMotion: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
  vectorStress: new THREE.MeshBasicMaterial({ color: 0xfb7185 })
};

function box(width, height, depth, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radiusTop, radiusBottom, height, material, x, y, z, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(x, y + height / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createWorld() {
  world.clear();
  labelsLayer.innerHTML = "";
  buildings.length = 0;
  cars.length = 0;
  trees.length = 0;
  people.length = 0;
  steamPuffs.length = 0;
  rainDrops.length = 0;

  world.add(box(112, 0.5, 88, materials.grass, 0, -0.25, 0));
  createRoadNetwork();
  createWorldBoundary();
  createCityBlocks();
  createParkAndWater();
  createVehicles();
  createTrees();
  createPeople();
  createTrafficLights();
  createPowerLines();
  createScienceVectors();
}

function createRoadNetwork() {
  const roads = [
    [112, 0.24, 10, 0, 0.08, 0],
    [10, 0.25, 88, 0, 0.09, 0],
    [112, 0.22, 7, 0, 0.09, -28],
    [112, 0.22, 7, 0, 0.09, 28],
    [7, 0.23, 88, -32, 0.09, 0],
    [7, 0.23, 88, 32, 0.09, 0]
  ];
  roads.forEach(([w, h, d, x, y, z]) => {
    world.add(box(w, h, d, materials.asphaltPlain, x, y - 0.015, z));
    world.add(box(w * 0.985, h + 0.03, d * 0.985, materials.asphalt, x, y + 0.035, z));
  });
  const curbs = [
    [112, 0.32, 0.5, 0, 0.22, -5.4], [112, 0.32, 0.5, 0, 0.22, 5.4],
    [0.5, 0.32, 88, -5.4, 0.23, 0], [0.5, 0.32, 88, 5.4, 0.23, 0],
    [112, 0.3, 0.42, 0, 0.22, -31.7], [112, 0.3, 0.42, 0, 0.22, -24.3],
    [112, 0.3, 0.42, 0, 0.22, 24.3], [112, 0.3, 0.42, 0, 0.22, 31.7],
    [0.42, 0.3, 88, -35.7, 0.22, 0], [0.42, 0.3, 88, -28.3, 0.22, 0],
    [0.42, 0.3, 88, 28.3, 0.22, 0], [0.42, 0.3, 88, 35.7, 0.22, 0]
  ];
  curbs.forEach(([w, h, d, x, y, z]) => world.add(box(w, h, d, materials.sidewalk, x, y, z)));
  for (let x = -52; x <= 52; x += 9) {
    world.add(box(4.3, 0.16, 0.42, materials.stripe, x, 0.1, 0));
    world.add(box(4.3, 0.14, 0.35, materials.stripe, x, 0.1, 28));
    world.add(box(4.3, 0.14, 0.35, materials.stripe, x, 0.1, -28));
  }
  for (let z = -40; z <= 40; z += 9) {
    world.add(box(0.42, 0.16, 4.3, materials.stripe, 0, 0.1, z));
    world.add(box(0.35, 0.14, 4.3, materials.stripe, -32, 0.1, z));
    world.add(box(0.35, 0.14, 4.3, materials.stripe, 32, 0.1, z));
  }
  [[-16, -6], [18, 7], [-46, 18], [45, -18]].forEach(([x, z]) => {
    world.add(box(15, 0.16, 4, materials.stripe, x, 0.12, z));
    for (let i = -6; i <= 6; i += 3) world.add(box(0.55, 0.18, 4.2, materials.asphaltPlain, x + i, 0.16, z));
  });
}

function createWorldBoundary() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.82 });
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.2 });
  world.add(box(116, 1.2, 0.6, wallMaterial, 0, 0, -44.6));
  world.add(box(116, 1.2, 0.6, wallMaterial, 0, 0, 44.6));
  world.add(box(0.6, 1.2, 90, wallMaterial, -56.6, 0, 0));
  world.add(box(0.6, 1.2, 90, wallMaterial, 56.6, 0, 0));
  world.add(box(116, 0.22, 0.22, railMaterial, 0, 1.28, -44.9));
  world.add(box(116, 0.22, 0.22, railMaterial, 0, 1.28, 44.9));
  world.add(box(0.22, 0.22, 90, railMaterial, -56.9, 1.28, 0));
  world.add(box(0.22, 0.22, 90, railMaterial, 56.9, 1.28, 0));
}

function createCityBlocks() {
  const positions = [
    [-45, -40, 8, 18, 8], [-33, -41, 9, 30, 10], [-18, -42, 10, 16, 8],
    [18, -42, 12, 38, 10], [34, -41, 8, 22, 8], [48, -39, 9, 28, 9],
    [-48, -17, 8, 14, 8], [-20, -16, 11, 48, 11], [20, -17, 10, 26, 9], [46, -16, 11, 18, 9],
    [-46, 16, 10, 34, 9], [-20, 17, 9, 20, 9], [20, 16, 12, 44, 12], [45, 17, 8, 24, 8],
    [-48, 41, 11, 22, 10], [-33, 40, 8, 16, 8], [17, 41, 10, 30, 10], [35, 40, 12, 36, 9]
  ];

  positions.forEach(([x, z, width, height, depth], index) => {
    const group = new THREE.Group();
    const facade = new THREE.MeshStandardMaterial({
      color: index % 3 === 0 ? 0xb9c3cf : index % 3 === 1 ? 0xd6d3d1 : 0xaab6c5,
      roughness: 0.76,
      metalness: 0.03
    });
    const body = box(width, height, depth, facade, 0, 0, 0);
    group.add(body);

    const front = box(width * 0.92, height * 0.9, 0.08, materials.glass, 0, height * 0.05, depth / 2 + 0.05);
    front.castShadow = false;
    group.add(front);

    const roof = box(width + 0.6, 0.4, depth + 0.6, materials.sidewalk, 0, height + 0.02, 0);
    group.add(roof);
    const antenna = cylinder(0.06, 0.08, 3 + Math.random() * 4, materials.concrete, width * 0.22, height + 0.2, depth * 0.18, 10);
    group.add(antenna);

    group.position.set(x, 0, z);
    group.userData = { baseHeight: height, body, roof, facadeColor: facade.color.clone(), damage: 0 };
    buildings.push(group);
    world.add(group);
  });
}

function createParkAndWater() {
  const parkMaterial = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 });
  world.add(box(26, 0.08, 18, parkMaterial, -42, 0.04, 31));
  world.add(box(20, 0.08, 18, parkMaterial, 42, 0.04, 31));
  world.add(box(18, 0.08, 14, parkMaterial, 42, 0.04, -32));
  [
    [-47, 37, 8, 0.38], [-38, 37, 7, 0.25], [-33, 25, 7, -0.25],
    [35, 24, 8, 0.25], [49, 38, 7, -0.35], [36, -36, 7, 0.15]
  ].forEach(([x, z, length, rot]) => {
    const bench = new THREE.Group();
    bench.add(box(length, 0.35, 0.55, new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 }), 0, 0.62, 0));
    bench.add(box(length, 0.28, 0.18, new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 }), 0, 1.05, -0.32));
    bench.add(box(0.16, 0.8, 0.16, materials.concrete, -length / 2 + 0.7, 0.08, 0.15));
    bench.add(box(0.16, 0.8, 0.16, materials.concrete, length / 2 - 0.7, 0.08, 0.15));
    bench.position.set(x, 0, z);
    bench.rotation.y = rot;
    world.add(bench);
  });

  const water = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 0.22, 80), materials.water);
  water.position.set(-42, 0.12, 31);
  water.name = "water";
  water.receiveShadow = true;
  world.add(water);

  const bridge = box(22, 0.7, 3.2, materials.sidewalk, -42, 0.55, 31);
  bridge.name = "bridge";
  world.add(bridge);

  for (let i = -9; i <= 9; i += 3) {
    world.add(cylinder(0.12, 0.16, 2.4, materials.concrete, -42 + i, 0.62, 29.3, 12));
    world.add(cylinder(0.12, 0.16, 2.4, materials.concrete, -42 + i, 0.62, 32.7, 12));
  }

  const fountain = cylinder(1.9, 2.4, 0.65, materials.concrete, 42, 0, 31, 40);
  fountain.name = "fountain";
  world.add(fountain);
  const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.18, 40), materials.water.clone());
  fountainWater.position.set(42, 0.78, 31);
  fountainWater.name = "fountainWater";
  world.add(fountainWater);
}

function createVehicles() {
  const carSpecs = [
    [-42, -2.6, 0xef4444, 0.18, false, 0], [-6, 2.6, 0x2563eb, -0.15, false, 16], [28, -30.2, 0xf97316, 0.14, false, 32],
    [50, 30.2, 0x14b8a6, -0.2, false, 48], [-2.6, -34, 0xfacc15, 0.16, true, 0], [-34.7, 6, 0xa855f7, -0.13, true, 17],
    [34.7, -24, 0xe11d48, 0.19, true, 34], [2.6, 28, 0x38bdf8, -0.16, true, 51]
  ];
  carSpecs.forEach((spec) => createCar(...spec));
}

function createCar(x, z, color, speed, vertical = false, phase = 0) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.12 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.42 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.28, metalness: 0.55 });
  group.add(box(4.8, 0.72, 2.08, bodyMaterial, 0, 0.42, 0));
  group.add(box(2.0, 0.5, 1.82, bodyMaterial, -1.32, 0.82, 0));
  group.add(box(1.05, 0.42, 1.78, bodyMaterial, 1.64, 0.76, 0));
  group.add(box(2.0, 0.86, 1.52, materials.glass, -0.28, 1.03, 0));
  group.add(box(0.55, 0.38, 1.36, materials.glass, -1.36, 1.08, 0));
  group.add(box(0.55, 0.34, 1.28, materials.glass, 0.8, 1.02, 0));
  group.add(box(0.18, 0.18, 1.72, chrome, -2.48, 0.56, 0));
  group.add(box(0.16, 0.18, 1.72, chrome, 2.48, 0.54, 0));
  group.add(box(0.16, 0.18, 0.52, new THREE.MeshBasicMaterial({ color: 0xfff7ad }), -2.58, 0.68, -0.62));
  group.add(box(0.16, 0.18, 0.52, new THREE.MeshBasicMaterial({ color: 0xfff7ad }), -2.58, 0.68, 0.62));
  group.add(box(0.14, 0.16, 0.46, new THREE.MeshBasicMaterial({ color: 0xff1f1f }), 2.58, 0.64, -0.62));
  group.add(box(0.14, 0.16, 0.46, new THREE.MeshBasicMaterial({ color: 0xff1f1f }), 2.58, 0.64, 0.62));
  group.add(box(2.0, 0.08, 1.45, dark, -0.2, 1.5, 0));
  for (const wx of [-1.55, 1.55]) {
    for (const wz of [-1.08, 1.08]) {
      const wheel = cylinder(0.43, 0.43, 0.36, dark, wx, 0.15, wz, 24);
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(0.2, 0.2, 0.39, chrome, wx, 0.15, wz, 18);
      hub.rotation.z = Math.PI / 2;
      group.add(wheel, hub);
    }
  }
  group.position.set(x, 0.28, z);
  group.rotation.y = vertical ? Math.PI / 2 : 0;
  group.userData = { speed, vertical, homeX: x, homeZ: z, laneX: x, laneZ: z, phase, skid: 0 };
  cars.push(group);
  world.add(group);
}

function createTrees() {
  for (let i = 0; i < 54; i += 1) {
    const edge = i % 4;
    let x = -53 + Math.random() * 106;
    let z = -41 + Math.random() * 82;
    if (edge === 0) z = -50 + Math.random() * 6;
    if (edge === 1) z = 44 + Math.random() * 6;
    if (edge === 2) x = -56 + Math.random() * 7;
    if (edge === 3) x = 49 + Math.random() * 7;
    createTree(x, z);
  }
}

function createTree(x, z) {
  const group = new THREE.Group();
  const trunk = cylinder(0.22, 0.42, 3.4, materials.trunk, 0, 0, 0, 14);
  group.add(trunk);
  const crownMaterial = materials.leaves.clone();
  const crownParts = [];
  [
    [1.75, 2.2, 2.6],
    [1.45, 1.8, 3.55],
    [1.08, 1.35, 4.3]
  ].forEach(([radius, height, yOffset]) => {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 24), crownMaterial);
    crown.position.y = yOffset;
    crown.castShadow = true;
    crown.receiveShadow = true;
    crownParts.push(crown);
    group.add(crown);
  });
  const leafySphere = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), crownMaterial);
  leafySphere.position.set(0.42, 3.72, -0.18);
  leafySphere.castShadow = true;
  crownParts.push(leafySphere);
  group.add(leafySphere);
  group.position.set(x, 0, z);
  group.userData = { crown: crownParts[0], crownParts, baseColor: crownMaterial.color.clone() };
  trees.push(group);
  world.add(group);
}

function createPeople() {
  for (let i = 0; i < 28; i += 1) createPerson(i);
}

function createPerson(index) {
  const group = new THREE.Group();
  const shirtColors = [0x0f766e, 0x2563eb, 0xbe123c, 0x7c3aed, 0x334155, 0xea580c];
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColors[index % shirtColors.length], roughness: 0.75 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
  group.add(cylinder(0.2, 0.24, 0.95, shirt, 0, 0.76, 0, 14));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 12), materials.skin);
  head.position.y = 1.78;
  head.castShadow = true;
  group.add(head);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xd6a77a, roughness: 0.75 });
  const armLeft = box(0.12, 0.74, 0.12, armMaterial, -0.35, 0.82, 0);
  const armRight = box(0.12, 0.74, 0.12, armMaterial, 0.35, 0.82, 0);
  const legLeft = box(0.13, 0.8, 0.15, pants, -0.13, 0.02, 0);
  const legRight = box(0.13, 0.8, 0.15, pants, 0.13, 0.02, 0);
  const footLeft = box(0.18, 0.08, 0.38, new THREE.MeshStandardMaterial({ color: 0x111827 }), -0.13, -0.38, 0.08);
  const footRight = box(0.18, 0.08, 0.38, new THREE.MeshStandardMaterial({ color: 0x111827 }), 0.13, -0.38, 0.08);
  group.add(armLeft, armRight, legLeft, legRight, footLeft, footRight);
  const path = pedestrianPaths[index % pedestrianPaths.length];
  group.userData = {
    path,
    progress: (index / 28 + (index % 5) * 0.07) % 1,
    speed: 0.006 + (index % 4) * 0.0015,
    armLeft,
    armRight,
    legLeft,
    legRight,
    footLeft,
    footRight
  };
  positionPersonOnPath(group, group.userData.progress);
  group.scale.setScalar(0.86);
  people.push(group);
  world.add(group);
}

function createTrafficLights() {
  const lightPositions = [
    [-7.2, -7.2, 0], [7.2, 7.2, Math.PI], [-7.2, 7.2, Math.PI / 2], [7.2, -7.2, -Math.PI / 2],
    [-37.2, -7.2, 0], [-27.2, 7.2, Math.PI], [27.2, -7.2, 0], [37.2, 7.2, Math.PI],
    [-7.2, -31.8, Math.PI / 2], [7.2, -24.2, -Math.PI / 2], [-7.2, 24.2, Math.PI / 2], [7.2, 31.8, -Math.PI / 2]
  ];
  lightPositions.forEach(([x, z, rot], index) => {
    const group = new THREE.Group();
    group.add(cylinder(0.1, 0.14, 4.4, new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.45, metalness: 0.4 }), 0, 0, 0, 12));
    group.add(box(0.18, 0.18, 1.5, new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.45, metalness: 0.4 }), 0.68, 4.2, 0));
    const signal = box(0.48, 1.2, 0.34, new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35 }), 1.42, 3.52, 0);
    group.add(signal);
    [
      [0xff2a2a, 3.94, index % 3 === 0],
      [0xfacc15, 3.52, index % 3 === 1],
      [0x22c55e, 3.1, index % 3 === 2]
    ].forEach(([color, y, active]) => {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 12),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: active ? 1.8 : 0.25,
          roughness: 0.25
        })
      );
      bulb.position.set(1.61, y, 0.18);
      group.add(bulb);
    });
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    world.add(group);
  });
}

function createPowerLines() {
  for (const x of [-55, 55]) {
    for (let z = -36; z <= 36; z += 18) {
      world.add(cylinder(0.12, 0.18, 7, materials.concrete, x, 0, z, 12));
    }
  }
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1f2937 });
  [-55, 55].forEach((x) => {
    const points = [];
    for (let z = -36; z <= 36; z += 18) points.push(new THREE.Vector3(x, 7, z));
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
  });
}

function createScienceVectors() {
  scienceAnchors.gravity = new THREE.Object3D();
  scienceAnchors.gravity.position.set(18, 17, -42);
  world.add(scienceAnchors.gravity);
  scienceAnchors.friction = new THREE.Object3D();
  scienceAnchors.friction.position.set(-8, 1.3, 0);
  world.add(scienceAnchors.friction);
  scienceAnchors.oxygen = new THREE.Object3D();
  scienceAnchors.oxygen.position.set(21, 4, 5);
  world.add(scienceAnchors.oxygen);
  scienceAnchors.water = new THREE.Object3D();
  scienceAnchors.water.position.set(-42, 3, 31);
  world.add(scienceAnchors.water);
  scienceAnchors.scale = new THREE.Object3D();
  scienceAnchors.scale.position.set(-10, 2.6, 7);
  world.add(scienceAnchors.scale);
  scienceAnchors.stress = new THREE.Object3D();
  scienceAnchors.stress.position.set(20, 38, 16);
  world.add(scienceAnchors.stress);

  scienceArrows.gravity = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(18, 28, -42),
    12,
    0xff7a18,
    2.4,
    1.2
  );
  scienceArrows.friction = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-14, 1.1, 0),
    12,
    0x22d3ee,
    2.2,
    1.1
  );
  scienceArrows.wind = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-48, 11, -18),
    24,
    0x93c5fd,
    3.2,
    1.6
  );
  scienceArrows.stress = new THREE.ArrowHelper(
    new THREE.Vector3(0.25, -1, 0).normalize(),
    new THREE.Vector3(20, 42, 16),
    16,
    0xfb7185,
    2.8,
    1.3
  );
  scienceArrows.vapor = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-42, 2, 31),
    11,
    0xa5f3fc,
    2.2,
    1.1
  );
  Object.values(scienceArrows).forEach((arrow) => {
    arrow.visible = false;
    world.add(arrow);
  });

  for (let i = 0; i < 80; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.8, 14, 10), materials.steam.clone());
    puff.position.set(-49 + Math.random() * 14, 0.7 + Math.random() * 4, 23 + Math.random() * 15);
    puff.visible = false;
    steamPuffs.push(puff);
    world.add(puff);
  }

  const rainMaterial = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.65 });
  for (let i = 0; i < 160; i += 1) {
    const drop = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.25, -1.8, 0)]),
      rainMaterial
    );
    drop.position.set(-56 + Math.random() * 112, 10 + Math.random() * 34, -44 + Math.random() * 88);
    drop.visible = false;
    rainDrops.push(drop);
    world.add(drop);
  }
}

const lawConfig = {
  gravity: {
    min: 0.1,
    max: 5,
    step: 0.1,
    label: (value) => `Gravity multiplier: ${value.toFixed(1)}x`,
    set: (value) => { simState.gravity = value; }
  },
  oxygen: {
    min: 0,
    max: 35,
    step: 1,
    label: (value) => `Oxygen level: ${Math.round(value)}%`,
    set: (value) => { simState.oxygen = value; }
  },
  friction: {
    min: 0,
    max: 1.5,
    step: 0.05,
    label: (value) => `Friction coefficient: ${value.toFixed(2)}`,
    set: (value) => { simState.friction = value; }
  },
  scale: {
    min: 0.02,
    max: 2,
    step: 0.02,
    label: (value) => `Human size: ${Math.round(value * 100)}%`,
    set: (value) => { simState.humanScale = value; }
  },
  boiling: {
    min: 32,
    max: 230,
    step: 1,
    label: (value) => `Water boiling point: ${Math.round(value)}°F`,
    set: (value) => { simState.boilingPoint = value; }
  }
};

function parsePrompt(text) {
  const lower = text.toLowerCase();
  const next = defaultState();
  next.prompt = text.trim() || "What if gravity became 2x stronger?";
  next.gravity = 1;

  const multiplierMatch = lower.match(/(?:gravity|gravitation)[^\d]*(\d+(?:\.\d+)?)\s*x/);
  const leadingGravityMatch = lower.match(/(\d+(?:\.\d+)?)\s*x\s*(?:stronger\s*)?(?:gravity|gravitation)/);
  if (multiplierMatch) next.gravity = clamp(Number(multiplierMatch[1]), 0.1, 5);
  if (leadingGravityMatch) next.gravity = clamp(Number(leadingGravityMatch[1]), 0.1, 5);
  if (/(gravity[^.?!]*(double|twice|2x))|((double|twice|2x)[^.?!]*gravity)/.test(lower)) next.gravity = 2;
  if (/(gravity[^.?!]*(triple|3x))|((triple|3x)[^.?!]*gravity)/.test(lower)) next.gravity = 3;
  if (/(low|weak|moon|mars|less|lighter)[^.?!]*gravity|gravity[^.?!]*(low|weak|less|lighter|moon|mars)/.test(lower)) next.gravity = 0.38;
  if (/(no|zero|without)[^.?!]*gravity|gravity[^.?!]*(disappears|vanished|gone|zero|none)/.test(lower)) next.gravity = 0.05;
  if (/(strong|heavy|stronger|heavier)[^.?!]*gravity|gravity[^.?!]*(strong|heavy|stronger|heavier)/.test(lower) && !multiplierMatch && !leadingGravityMatch) next.gravity = Math.max(next.gravity, 2);

  const oxygenPercent = lower.match(/oxygen[^\d]*(\d+(?:\.\d+)?)\s*%/);
  if (oxygenPercent) next.oxygen = clamp(Number(oxygenPercent[1]), 0, 35);
  if (/(no|zero|without)[^.?!]*oxygen|oxygen[^.?!]*(disappears|vanished|gone|zero|none)|no air|air disappears|air vanished/.test(lower)) next.oxygen = 0;
  if (/less oxygen|low oxygen|thin air|high altitude|hard to breathe/.test(lower)) next.oxygen = 10;
  if (/more oxygen|extra oxygen|oxygen rich|oxygen-rich|pure oxygen/.test(lower)) next.oxygen = 32;
  if (/(no|zero|without)[^.?!]*atmosphere|atmosphere[^.?!]*(disappears|gone)|vacuum|outer space|in space/.test(lower)) {
    next.atmosphere = 0.03;
    next.oxygen = 0;
  }
  if (/thin atmosphere|less air/.test(lower)) next.atmosphere = 0.35;
  if (/thick atmosphere|more air|dense air/.test(lower)) next.atmosphere = 1.8;

  if (/(no|zero|without)[^.?!]*friction|friction[^.?!]*(disappears|vanished|gone|zero|none)|frictionless/.test(lower)) next.friction = 0;
  if (/low friction|slippery|ice everywhere|tiny friction/.test(lower)) next.friction = 0.12;
  if (/more friction|sticky|rough|high friction/.test(lower)) next.friction = 1.45;

  if (/ant[- ]?sized|ant size|tiny humans|humans become small|people become small|shrink|miniature/.test(lower)) next.humanScale = 0.08;
  if (/giant humans|humans become giant|people become giant|huge humans|grow|giant people/.test(lower)) next.humanScale = 1.8;
  const scalePercent = lower.match(/humans?[^\d]*(\d+(?:\.\d+)?)\s*%/);
  if (scalePercent) next.humanScale = clamp(Number(scalePercent[1]) / 100, 0.02, 2);

  if (/water boils at room temperature|water boiled at room temperature|boils at room temp|room temperature boiling|boil at room temp/.test(lower)) next.boilingPoint = 72;
  const boilingMatch = lower.match(/water[^\d]*(?:boil|boils|boiling point)[^\d]*(\d+(?:\.\d+)?)\s*(c|celsius|f|fahrenheit)?/);
  if (boilingMatch) {
    const raw = Number(boilingMatch[1]);
    const unit = boilingMatch[2];
    next.boilingPoint = clamp(unit && unit.startsWith("c") ? raw * 9 / 5 + 32 : raw, 32, 230);
  }
  if (/hotter|extreme heat|heat wave|very hot/.test(lower)) next.temperatureF = 115;
  if (/colder|ice age|freezing|very cold/.test(lower)) next.temperatureF = 25;
  const tempMatch = lower.match(/(?:temperature|temp)[^\d-]*(-?\d+(?:\.\d+)?)\s*(c|celsius|f|fahrenheit)?/);
  if (tempMatch) {
    const raw = Number(tempMatch[1]);
    const unit = tempMatch[2];
    next.temperatureF = clamp(unit && unit.startsWith("c") ? raw * 9 / 5 + 32 : raw, -80, 180);
  }

  if (/acid rain|acidic rain/.test(lower)) next.acidity = 1;
  if (/windy|hurricane|strong wind|tornado|wind becomes strong|wind was strong/.test(lower)) next.wind = /hurricane|tornado/.test(lower) ? 1 : 0.55;
  if (/earthquake|ground shakes|ground shaking|tectonic|buildings shake/.test(lower)) next.earthquake = 1;

  return next;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setScenario(nextState) {
  simState = nextState;
  updateReadout();
}

function setFullCityView() {
  camera.position.set(78, 62, 86);
  controls.target.set(0, 8, 0);
  controls.update();
}

function selectSliderLaw(law) {
  activeSliderLaw = law;
  const config = lawConfig[law];
  const value = law === "gravity" ? simState.gravity :
    law === "oxygen" ? simState.oxygen :
    law === "friction" ? simState.friction :
    law === "scale" ? simState.humanScale :
    simState.boilingPoint;
  slider.min = config.min;
  slider.max = config.max;
  slider.step = config.step;
  slider.value = value;
  sliderLabel.textContent = config.label(Number(value));
  lawButtons.forEach((button) => button.classList.toggle("active", button.dataset.law === law));
}

function scenarioTitle() {
  const parts = [];
  if (simState.gravity > 1.25) parts.push("heavy gravity");
  if (simState.gravity < 0.75) parts.push("low gravity");
  if (simState.oxygen < 12) parts.push("oxygen crisis");
  if (simState.friction < 0.25) parts.push("frictionless roads");
  if (simState.humanScale < 0.2) parts.push("ant-sized humans");
  if (simState.boilingPoint < 95) parts.push("boiling water world");
  if (simState.atmosphere < 0.2) parts.push("near vacuum");
  if (simState.wind > 0.5) parts.push("dangerous wind");
  if (simState.earthquake > 0) parts.push("earthquake stress");
  return parts.length ? parts.join(" + ") : "normal Earth";
}

function updateReadout() {
  selectSliderLaw(activeSliderLaw);
  const title = scenarioTitle();
  worldBadge.textContent = `Analyzed: ${title}`;
  worldTitle.textContent = title.replace(/\b\w/g, (letter) => letter.toUpperCase());
  explainTitle.textContent = simState.prompt;

  const consequences = [];
  consequences.push(`Weight is ${Math.round(simState.gravity * 100)}% of normal, so structures and jumps respond immediately.`);
  if (simState.friction < 0.25) consequences.push("Low friction makes tires, shoes, and brakes lose grip, so cars slide instead of stopping.");
  if (simState.oxygen < 12) consequences.push("Low oxygen shuts down fire and makes aerobic respiration unsafe for people and ecosystems.");
  if (simState.boilingPoint <= simState.temperatureF + 5) consequences.push("Water is near or above its boiling point, so lakes, fountains, and pipes vent vapor.");
  if (simState.humanScale < 0.2) consequences.push("Tiny humans experience puddles as lakes, curbs as cliffs, and air resistance as a major force.");
  if (simState.atmosphere < 0.2) consequences.push("A thin or missing atmosphere removes oxygen, reduces drag, and makes liquid water unstable.");
  if (simState.wind > 0.5) consequences.push("Strong wind loads bend trees, push cars sideways, and increase stress on tall buildings.");
  if (simState.earthquake > 0) consequences.push("Ground shaking adds lateral forces that make tall buildings sway and crack.");
  explainCopy.textContent = consequences.join(" ");

  analysisStack.textContent = [
    `gravity ${simState.gravity.toFixed(2)}x`,
    `oxygen ${Math.round(simState.oxygen)}%`,
    `friction ${simState.friction.toFixed(2)}`,
    `human size ${Math.round(simState.humanScale * 100)}%`,
    `water boils ${Math.round(simState.boilingPoint)}°F`,
    `air pressure ${Math.round(simState.atmosphere * 100)}%`
  ].join(", ");

  metricOne.textContent = "Structural load";
  metricOneValue.textContent = simState.gravity > 1.6 || simState.earthquake ? "Severe" : simState.gravity < 0.7 ? "Light" : "Normal";
  metricTwo.textContent = "Transportation";
  metricTwoValue.textContent = simState.friction < 0.25 ? "Skidding" : simState.gravity > 2 ? "Heavy drag" : "Moving";
  metricThree.textContent = "Habitability";
  metricThreeValue.textContent = simState.oxygen < 12 || simState.boilingPoint < 90 || simState.atmosphere < 0.2 ? "Danger" : "Stable";
}

function applySimulation(time) {
  const heavy = Math.max(0, simState.gravity - 1);
  const lowGravity = Math.max(0, 1 - simState.gravity);
  const noGrip = Math.max(0, 1 - simState.friction);
  const oxygenStress = Math.max(0, (14 - simState.oxygen) / 14);
  const boiling = simState.boilingPoint <= simState.temperatureF + 8 ? 1 : 0;
  const thinAir = Math.max(0, 1 - simState.atmosphere);
  const shake = simState.earthquake * Math.sin(time * 18) * 0.45;

  world.position.x = shake;
  world.rotation.z = simState.earthquake ? Math.sin(time * 22) * 0.006 : 0;

  buildings.forEach((building, index) => {
    const sway = Math.sin(time * (1.3 + heavy * 0.4) + index) * (heavy * 0.025 + simState.wind * 0.04 + simState.earthquake * 0.05);
    building.rotation.z = sway + shake * 0.012;
    building.rotation.x = Math.cos(time * 1.1 + index) * simState.wind * 0.016;
    building.scale.y = Math.max(0.42, 1 - heavy * 0.1);
    const damage = clamp(heavy * 0.3 + simState.earthquake * 0.8 + simState.acidity * 0.15, 0, 1);
    building.userData.body.material.color.copy(building.userData.facadeColor).lerp(new THREE.Color(0x6b7280), damage);
  });

  cars.forEach((car, index) => {
    const baseSpeed = car.userData.speed;
    const gravitySpeed = baseSpeed / Math.sqrt(Math.max(simState.gravity, 0.12));
    const speed = gravitySpeed * (1 + noGrip * 3.5 + thinAir * 0.35);
    const horizontalLimit = 50;
    const verticalLimit = 40;
    const offset = wrapLane(time * speed * 10 + car.userData.phase, car.userData.vertical ? verticalLimit : horizontalLimit);
    const lateralSkid = Math.sin(time * 3.5 + index) * noGrip;
    const windPush = simState.wind * Math.sin(time * 2 + index);
    if (car.userData.vertical) {
      car.position.z = offset;
      car.position.x = clamp(car.userData.laneX + lateralSkid * 2.4 + windPush * 1.2, car.userData.laneX - 2.8, car.userData.laneX + 2.8);
    } else {
      car.position.x = offset;
      car.position.z = clamp(car.userData.laneZ + lateralSkid * 2.4 + windPush * 1.2, car.userData.laneZ - 2.8, car.userData.laneZ + 2.8);
    }
    car.rotation.z = Math.sin(time * 7 + index) * noGrip * 0.26;
    car.rotation.y = (car.userData.vertical ? Math.PI / 2 : 0) + Math.sin(time * 5 + index) * noGrip * 0.32;
    car.scale.y = Math.max(0.72, 1 - heavy * 0.06);
  });

  trees.forEach((tree, index) => {
    tree.rotation.z = Math.sin(time * 2.2 + index) * (simState.wind * 0.22 + oxygenStress * 0.05);
    tree.scale.y = Math.max(0.55, 1 - heavy * 0.05);
    const treeColor = tree.userData.baseColor.clone()
      .lerp(new THREE.Color(0x94a3b8), oxygenStress)
      .lerp(new THREE.Color(0xb45309), simState.acidity * 0.45);
    tree.userData.crownParts.forEach((part) => part.material.color.copy(treeColor));
  });

  people.forEach((person, index) => {
    const data = person.userData;
    data.progress = (data.progress + data.speed * Math.max(0.25, simState.friction) / Math.sqrt(Math.max(simState.gravity, 0.2))) % 1;
    positionPersonOnPath(person, data.progress);
    const step = Math.sin(time * 8 + index);
    data.legLeft.rotation.x = step * 0.45;
    data.legRight.rotation.x = -step * 0.45;
    data.armLeft.rotation.x = -step * 0.38;
    data.armRight.rotation.x = step * 0.38;
    data.footLeft.rotation.x = Math.max(0, -step) * 0.25;
    data.footRight.rotation.x = Math.max(0, step) * 0.25;
    person.scale.setScalar(simState.humanScale * 0.86);
    person.position.y = Math.abs(Math.sin(time * 3 + index)) * (lowGravity * 3.5 + 0.04);
    person.rotation.z = Math.sin(time * 5 + index) * (noGrip * 0.7 + simState.wind * 0.18);
  });

  const flame = world.getObjectByName("flame");
  if (flame) {
    flame.visible = simState.oxygen > 15 && simState.atmosphere > 0.25;
    flame.scale.setScalar(clamp(simState.oxygen / 21, 0.25, 1.65));
    flame.position.y = 1.1 + Math.sin(time * 12) * 0.16;
  }

  const water = world.getObjectByName("water");
  if (water) {
    water.material.opacity = boiling || thinAir > 0.8 ? 0.32 : 0.76;
    water.scale.setScalar(boiling ? 0.88 + Math.sin(time * 3) * 0.02 : 1);
  }
  const fountainWater = world.getObjectByName("fountainWater");
  if (fountainWater) fountainWater.visible = !boiling && simState.atmosphere > 0.15;

  steamPuffs.forEach((puff, index) => {
    puff.visible = Boolean(boiling || thinAir > 0.75);
    if (!puff.visible) return;
    puff.position.y = 0.7 + ((time * (2.8 + thinAir * 2) + index * 0.31) % 16);
    puff.position.x += Math.sin(time * 0.8 + index) * 0.01 + simState.wind * 0.025;
    puff.material.opacity = Math.max(0, 0.54 - puff.position.y / 28);
  });

  rainDrops.forEach((drop, index) => {
    drop.visible = simState.acidity > 0 || simState.wind > 0.75;
    if (!drop.visible) return;
    drop.position.y -= 0.55 + simState.wind * 0.25;
    drop.position.x += simState.wind * 0.08;
    if (drop.position.y < 0) {
      drop.position.y = 34 + Math.random() * 14;
      drop.position.x = -56 + Math.random() * 112;
      drop.position.z = -44 + Math.random() * 88;
    }
  });

  sun.intensity = simState.atmosphere < 0.2 ? 5.5 : simState.oxygen < 8 ? 3.6 : 4.2;
  ambient.intensity = simState.atmosphere < 0.2 ? 0.55 : 1.6;
  const sky = simState.atmosphere < 0.2 ? 0x111827 : simState.oxygen < 8 ? 0xfed7aa : boiling ? 0xdbeafe : 0xcfefff;
  scene.background.set(sky);
  scene.fog.color.set(sky);
  scene.fog.density = simState.atmosphere < 0.2 ? 0.002 : boiling ? 0.022 : 0.013 + simState.wind * 0.01;

  updateScienceArrows(heavy, lowGravity, noGrip, boiling, thinAir);
}

function wrapLane(value, limit) {
  const span = limit * 2;
  return ((((value + limit) % span) + span) % span) - limit;
}

function positionPersonOnPath(person, progress) {
  const { path } = person.userData;
  const span = path.to - path.from;
  const offset = path.from + span * progress;
  if (path.orientation === "x") {
    person.position.x = offset;
    person.position.z = path.z;
    person.rotation.y = span >= 0 ? Math.PI / 2 : -Math.PI / 2;
  } else {
    person.position.x = path.x;
    person.position.z = offset;
    person.rotation.y = span >= 0 ? 0 : Math.PI;
  }
}

function updateScienceArrows(heavy, lowGravity, noGrip, boiling, thinAir) {
  const gravityChanged = heavy > 0.15 || lowGravity > 0.15;
  scienceArrows.gravity.visible = gravityChanged;
  scienceArrows.gravity.setLength(clamp(simState.gravity * 8, 3, 28), 2.4, 1.2);
  scienceArrows.gravity.setColor(new THREE.Color(simState.gravity > 1 ? 0xff7a18 : 0x93c5fd));

  scienceArrows.friction.visible = noGrip > 0.08 || simState.friction > 1.15;
  scienceArrows.friction.setLength(clamp((simState.friction + 0.08) * 12, 2, 23), 2.2, 1.1);
  scienceArrows.friction.setDirection(new THREE.Vector3(simState.friction < 0.25 ? 1 : -1, 0, 0));
  scienceArrows.friction.setColor(new THREE.Color(simState.friction < 0.25 ? 0x22d3ee : 0x22c55e));

  scienceArrows.wind.visible = simState.wind > 0.08 || simState.atmosphere < 0.25;
  scienceArrows.wind.setLength(clamp(simState.wind * 34 + thinAir * 10, 4, 34), 3.2, 1.6);
  scienceArrows.wind.setColor(new THREE.Color(simState.atmosphere < 0.25 ? 0x64748b : 0x93c5fd));

  scienceArrows.stress.visible = simState.gravity > 1.3 || simState.earthquake > 0 || simState.wind > 0.45;
  scienceArrows.stress.setLength(clamp(heavy * 12 + simState.wind * 10 + simState.earthquake * 14, 5, 30), 2.8, 1.3);

  scienceArrows.vapor.visible = Boolean(boiling || thinAir > 0.75);
  scienceArrows.vapor.setLength(clamp((boiling ? 12 : 0) + thinAir * 12, 4, 24), 2.2, 1.1);
}

function projectToLabel(anchor, text, className, visible) {
  let label = labelsLayer.querySelector(`[data-label="${anchor}"]`);
  if (!label) {
    label = document.createElement("div");
    label.dataset.label = anchor;
    labelsLayer.append(label);
  }
  label.className = `science-label ${className}`;
  label.textContent = text;
  label.style.display = visible ? "block" : "none";
  if (!visible || !scienceAnchors[anchor]) return;

  const vector = scienceAnchors[anchor].position.clone();
  vector.project(camera);
  const x = (vector.x * 0.5 + 0.5) * stage.clientWidth;
  const y = (-vector.y * 0.5 + 0.5) * stage.clientHeight;
  label.style.transform = `translate(${x}px, ${y}px)`;
}

function updateScienceLabels() {
  projectToLabel("gravity", `weight ${Math.round(simState.gravity * 100)}%`, "orange", simState.gravity > 1.15 || simState.gravity < 0.85);
  projectToLabel("friction", `friction μ=${simState.friction.toFixed(2)}`, "blue", simState.friction < 0.35 || simState.friction > 1.2);
  projectToLabel("oxygen", `oxygen ${Math.round(simState.oxygen)}%`, "green", simState.oxygen < 16 || simState.oxygen > 24);
  projectToLabel("water", `boiling point ${Math.round(simState.boilingPoint)}°F`, "cyan", simState.boilingPoint <= simState.temperatureF + 8 || simState.atmosphere < 0.2);
  projectToLabel("scale", `human size ${Math.round(simState.humanScale * 100)}%`, "yellow", simState.humanScale !== 1);
  projectToLabel("stress", "building stress + lateral forces", "pink", simState.gravity > 1.4 || simState.wind > 0.4 || simState.earthquake > 0);
}

function resize() {
  const rect = stage.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function animate(timeMs) {
  const time = timeMs / 1000;
  applySimulation(time);
  controls.update();
  renderer.render(scene, camera);
  updateScienceLabels();
  requestAnimationFrame(animate);
}

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setScenario(parsePrompt(promptInput.value));
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt;
    setScenario(parsePrompt(button.dataset.prompt));
  });
});

lawButtons.forEach((button) => {
  button.addEventListener("click", () => selectSliderLaw(button.dataset.law));
});

slider.addEventListener("input", () => {
  const value = Number(slider.value);
  lawConfig[activeSliderLaw].set(value);
  updateReadout();
});

resetButton.addEventListener("click", () => {
  promptInput.value = "What if gravity became 2x stronger?";
  setScenario(defaultState());
  createWorld();
  setFullCityView();
});

window.addEventListener("resize", resize);

createWorld();
promptInput.value = simState.prompt;
setScenario(simState);
setFullCityView();
resize();
requestAnimationFrame(animate);
