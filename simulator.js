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
const universalControls = document.querySelector("#universalControls");
const presetGrid = document.querySelector("#presetGrid");
const eventGrid = document.querySelector("#eventGrid");
const missionList = document.querySelector("#missionList");
const timeControls = document.querySelector("#timeControls");
const scaleSwitcher = document.querySelector("#scaleSwitcher");
const narratorText = document.querySelector("#narratorText");
const dashHealth = document.querySelector("#dashHealth");
const dashEnergy = document.querySelector("#dashEnergy");
const dashTraffic = document.querySelector("#dashTraffic");
const dashStructure = document.querySelector("#dashStructure");
const dashPollution = document.querySelector("#dashPollution");
const dashWater = document.querySelector("#dashWater");

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
const trafficLights = [];
const homes = [];
const disasterObjects = [];
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
let previousSimTime = 0;
let simClock = 0;
let timeScale = 1;
let paused = false;
let lastFrameMs = 0;
let activeMission = "";

function defaultState() {
  return {
    prompt: "What if gravity became 2x stronger?",
    gravity: 2,
    oxygen: 21,
    friction: 1,
    airResistance: 1,
    humanScale: 1,
    boilingPoint: 212,
    atmosphere: 1,
    temperatureF: 72,
    sunlight: 1,
    waterLevel: 1,
    magnetism: 1,
    acidity: 0,
    wind: 0,
    earthquake: 0,
    disaster: "",
    mission: ""
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
  trafficLights.length = 0;
  homes.length = 0;
  disasterObjects.length = 0;

  world.add(box(112, 0.5, 88, materials.grass, 0, -0.25, 0));
  createRoadNetwork();
  createWorldBoundary();
  createCityBlocks();
  createHomesAndDailyLife();
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

function createHomesAndDailyLife() {
  const homeMaterial = new THREE.MeshStandardMaterial({ color: 0xf3d2a4, roughness: 0.82 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.78 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.86 });
  [
    [-48, -2, 0.12],
    [-42, -2, -0.08],
    [43, 2, 0.08],
    [49, 2, -0.12]
  ].forEach(([x, z, rot], index) => {
    const home = new THREE.Group();
    home.add(box(5.4, 3.2, 4.8, homeMaterial, 0, 0, 0));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.25, 2.2, 4), roofMaterial);
    roof.position.y = 4.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    home.add(roof);
    home.add(box(1.1, 1.9, 0.12, new THREE.MeshStandardMaterial({ color: 0x78350f }), 0, 0.1, 2.47));
    home.add(box(1.2, 0.85, 0.13, materials.glass, -1.6, 1.6, 2.48));
    home.add(box(1.2, 0.85, 0.13, materials.glass, 1.6, 1.6, 2.48));

    const interior = new THREE.Group();
    interior.add(box(4.6, 0.08, 3.8, floorMaterial, 0, 0.08, 0));
    interior.add(box(1.4, 0.55, 0.9, new THREE.MeshStandardMaterial({ color: 0x2563eb }), -1.2, 0.2, -0.8));
    interior.add(box(0.8, 0.5, 0.8, new THREE.MeshStandardMaterial({ color: 0x92400e }), 1.2, 0.15, -0.7));
    interior.add(box(0.9, 1.2, 0.12, new THREE.MeshBasicMaterial({ color: 0xfacc15 }), 1.8, 1.5, 1.95));
    const resident = createMiniPerson(0x14b8a6);
    resident.position.set(-0.2, 0.24, 0.6);
    interior.add(resident);
    home.add(interior);

    home.position.set(x, 0, z);
    home.rotation.y = rot;
    home.userData = { resident, phase: index * 1.7 };
    homes.push(home);
    world.add(home);
  });
}

function createMiniPerson(color = 0x0f766e) {
  const group = new THREE.Group();
  group.add(cylinder(0.12, 0.15, 0.64, new THREE.MeshStandardMaterial({ color, roughness: 0.75 }), 0, 0.25, 0, 10));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), materials.skin);
  head.position.y = 0.95;
  head.castShadow = true;
  group.add(head);
  group.add(box(0.08, 0.45, 0.08, new THREE.MeshStandardMaterial({ color: 0x1f2937 }), -0.08, -0.06, 0));
  group.add(box(0.08, 0.45, 0.08, new THREE.MeshStandardMaterial({ color: 0x1f2937 }), 0.08, -0.06, 0));
  return group;
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
  const rollingParts = [];
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
      wheel.rotation.x = Math.PI / 2;
      const hub = cylinder(0.2, 0.2, 0.39, chrome, wx, 0.15, wz, 18);
      hub.rotation.x = Math.PI / 2;
      const tireSide = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.055, 10, 24), dark);
      tireSide.position.set(wx, 0.15, wz + (wz > 0 ? 0.19 : -0.19));
      tireSide.rotation.x = Math.PI / 2;
      tireSide.castShadow = true;
      rollingParts.push(wheel, hub, tireSide);
      group.add(wheel, hub, tireSide);
    }
  }
  group.position.set(x, 0.28, z);
  group.rotation.y = vertical ? Math.PI / 2 : 0;
  group.userData = { speed, vertical, homeX: x, homeZ: z, laneX: x, laneZ: z, phase, travel: phase, stopped: false, skid: 0, rollingParts };
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
    [-7.2, -7.2, 0, "h"], [7.2, 7.2, Math.PI, "h"], [-7.2, 7.2, Math.PI / 2, "v"], [7.2, -7.2, -Math.PI / 2, "v"],
    [-37.2, -7.2, 0, "h"], [-27.2, 7.2, Math.PI, "h"], [27.2, -7.2, 0, "h"], [37.2, 7.2, Math.PI, "h"],
    [-7.2, -31.8, Math.PI / 2, "v"], [7.2, -24.2, -Math.PI / 2, "v"], [-7.2, 24.2, Math.PI / 2, "v"], [7.2, 31.8, -Math.PI / 2, "v"]
  ];
  lightPositions.forEach(([x, z, rot, axis]) => {
    const group = new THREE.Group();
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x263241, roughness: 0.4, metalness: 0.55 });
    const casingMaterial = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.32, metalness: 0.35 });
    group.add(cylinder(0.09, 0.14, 5.2, poleMaterial, 0, 0, 0, 14));
    group.add(box(2.05, 0.16, 0.16, poleMaterial, 0.95, 4.78, 0));
    group.add(box(0.16, 0.55, 0.16, poleMaterial, 1.86, 4.34, 0));
    const signal = box(0.56, 1.55, 0.42, casingMaterial, 1.86, 3.42, 0);
    group.add(signal);
    const bulbs = {};
    [
      ["red", 0xff2a2a, 3.92],
      ["yellow", 0xfacc15, 3.42],
      ["green", 0x22c55e, 2.92]
    ].forEach(([name, color, y]) => {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 20, 14),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.18,
          roughness: 0.25
        })
      );
      bulb.position.set(2.08, y, 0.23);
      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 18, 1, true), casingMaterial);
      visor.position.set(2.08, y, 0.34);
      visor.rotation.x = Math.PI / 2;
      bulbs[name] = bulb;
      group.add(bulb);
      group.add(visor);
    });
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    group.userData = { axis, bulbs };
    trafficLights.push(group);
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
  if (/air resistance[^.?!]*(zero|none|disappears)|no air resistance|without air resistance/.test(lower)) next.airResistance = 0;
  if (/high air resistance|thick drag|more drag/.test(lower)) next.airResistance = 1.8;

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
  if (/sun disappears|no sunlight|dark earth/.test(lower)) next.sunlight = 0.05;
  if (/bright sun|more sunlight|solar flare/.test(lower)) next.sunlight = 1.8;
  if (/underwater|flood|water level rises|sea level rises/.test(lower)) next.waterLevel = 1.9;
  if (/drought|water disappears|no water/.test(lower)) next.waterLevel = 0.25;
  if (/magnetism disappears|no magnetism|zero magnetic/.test(lower)) next.magnetism = 0;
  if (/strong magnet|super magnet|magnetic field stronger|more magnetism/.test(lower)) next.magnetism = 2.5;
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

function setCameraScale(scale) {
  const views = {
    city: { camera: [78, 62, 86], target: [0, 8, 0] },
    building: { camera: [30, 24, 30], target: [18, 12, 14] },
    room: { camera: [51, 9, 11], target: [47, 2.4, 2] },
    human: { camera: [14, 6.5, 12], target: [2, 1.1, 7] },
    molecular: { camera: [-39, 7, 36], target: [-44, 1.3, 30] }
  };
  const view = views[scale] || views.city;
  camera.position.set(...view.camera);
  controls.target.set(...view.target);
  controls.update();
  scaleSwitcher?.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.scale === scale);
  });
}

function setFullCityView() {
  setCameraScale("city");
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
  if (simState.waterLevel > 1.4) parts.push("flooded city");
  if (simState.sunlight < 0.2) parts.push("dark world");
  if (simState.magnetism > 1.8) parts.push("magnetic surge");
  if (simState.disaster) parts.push(simState.disaster);
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
  if (simState.waterLevel > 1.4) consequences.push("Rising water blocks roads, slows pedestrians, and increases pressure on bridge supports.");
  if (simState.sunlight < 0.2) consequences.push("Low sunlight reduces solar generation and cools the city over time.");
  if (simState.magnetism > 1.8) consequences.push("Strong magnetic fields interfere with electronics, power flow, and vehicle sensors.");
  if (simState.disaster) consequences.push(`Disaster active: ${simState.disaster}. The outcome depends on the current physics settings.`);
  explainCopy.textContent = consequences.join(" ");

  analysisStack.textContent = [
    `gravity ${simState.gravity.toFixed(2)}x`,
    `oxygen ${Math.round(simState.oxygen)}%`,
    `friction ${simState.friction.toFixed(2)}`,
    `drag ${simState.airResistance.toFixed(2)}`,
    `temperature ${Math.round(simState.temperatureF)}°F`,
    `human size ${Math.round(simState.humanScale * 100)}%`,
    `water boils ${Math.round(simState.boilingPoint)}°F`,
    `air pressure ${Math.round(simState.atmosphere * 100)}%`,
    `sunlight ${Math.round(simState.sunlight * 100)}%`,
    `water ${Math.round(simState.waterLevel * 100)}%`,
    `magnetism ${simState.magnetism.toFixed(1)}x`
  ].join(", ");

  metricOne.textContent = "Structural load";
  metricOneValue.textContent = simState.gravity > 1.6 || simState.earthquake ? "Severe" : simState.gravity < 0.7 ? "Light" : "Normal";
  metricTwo.textContent = "Transportation";
  metricTwoValue.textContent = simState.friction < 0.25 ? "Skidding" : simState.gravity > 2 ? "Heavy drag" : "Moving";
  metricThree.textContent = "Habitability";
  metricThreeValue.textContent = simState.oxygen < 12 || simState.boilingPoint < 90 || simState.atmosphere < 0.2 ? "Danger" : "Stable";
  updateUniversalControls();
  updateDashboardAndNarrator();
}

function updateUniversalControls() {
  universalControls?.querySelectorAll("input[data-rule]").forEach((input) => {
    const rule = input.dataset.rule;
    const value = simState[rule];
    if (Number(input.value) !== Number(value)) input.value = value;
    const output = input.parentElement.querySelector("output");
    if (!output) return;
    if (rule === "gravity" || rule === "magnetism") output.textContent = `${Number(value).toFixed(1)}x`;
    else if (rule === "temperatureF") output.textContent = `${Math.round(value)}°F`;
    else if (["atmosphere", "sunlight", "waterLevel", "wind"].includes(rule)) output.textContent = `${Math.round(value * 100)}%`;
    else if (rule === "oxygen") output.textContent = `${Math.round(value)}%`;
    else output.textContent = Number(value).toFixed(2);
  });
}

function updateDashboardAndNarrator() {
  const healthScore = clamp(100 - Math.max(0, 14 - simState.oxygen) * 5 - Math.abs(simState.temperatureF - 72) * 0.6 - Math.max(0, simState.waterLevel - 1.2) * 25, 0, 100);
  const energyStress = clamp(Math.abs(simState.temperatureF - 72) * 0.8 + (1 - simState.sunlight) * 25 + Math.max(0, simState.magnetism - 1) * 18, 0, 100);
  const trafficStress = clamp((1 - simState.friction) * 80 + Math.max(0, simState.gravity - 1) * 18 + simState.wind * 25 + Math.max(0, simState.waterLevel - 1.1) * 35, 0, 100);
  const structureStress = clamp(Math.max(0, simState.gravity - 1) * 35 + simState.earthquake * 65 + simState.wind * 25 + Math.max(0, simState.waterLevel - 1.4) * 30, 0, 100);
  const pollution = clamp((21 - simState.oxygen) * 2 + (simState.disaster === "volcanic eruption" ? 70 : 0) + (simState.disaster === "radiation leak" ? 45 : 0), 0, 100);
  dashHealth.textContent = healthScore > 70 ? "Stable" : healthScore > 35 ? "Stressed" : "Critical";
  dashEnergy.textContent = energyStress < 30 ? "Normal" : energyStress < 65 ? "Strained" : "Blackout risk";
  dashTraffic.textContent = trafficStress < 30 ? "Flowing" : trafficStress < 65 ? "Congested" : "Gridlock";
  dashStructure.textContent = structureStress < 30 ? "Stable" : structureStress < 65 ? "Strained" : "Failure risk";
  dashPollution.textContent = pollution < 30 ? "Low" : pollution < 65 ? "Hazardous" : "Severe";
  dashWater.textContent = simState.waterLevel > 1.5 ? "Flooding" : simState.waterLevel < 0.45 ? "Drought" : "Normal";

  const notes = [];
  if (trafficStress > 60) notes.push("Traffic flow is breaking down because traction, gravity, wind, or flooding changed vehicle control.");
  if (energyStress > 55) notes.push("The power grid is stressed by temperature, sunlight loss, or magnetic interference.");
  if (healthScore < 50) notes.push("Citizen health is falling because oxygen, heat, or water conditions moved outside safe ranges.");
  if (structureStress > 55) notes.push("Structures are under visible stress from load, wind, shaking, or water pressure.");
  if (activeMission) notes.push(`Mission active: ${activeMission}`);
  narratorText.textContent = notes[0] || "The city is stable. Try a preset, disaster, or rule slider to start a cause-and-effect chain.";
}

function applySimulation(time) {
  const rawDt = previousSimTime ? time - previousSimTime : 0.016;
  const dt = paused ? 0 : Math.min(0.06, Math.max(0, rawDt));
  previousSimTime = time;
  const heavy = Math.max(0, simState.gravity - 1);
  const lowGravity = Math.max(0, 1 - simState.gravity);
  const noGrip = Math.max(0, 1 - simState.friction);
  const oxygenStress = Math.max(0, (14 - simState.oxygen) / 14);
  const boiling = simState.boilingPoint <= simState.temperatureF + 8 ? 1 : 0;
  const thinAir = Math.max(0, 1 - simState.atmosphere);
  const shake = simState.earthquake * Math.sin(time * 18) * 0.45;
  const flood = Math.max(0, simState.waterLevel - 1);
  const magneticDisruption = Math.max(0, simState.magnetism - 1);

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

  updateTrafficLights(time);

  cars.forEach((car, index) => {
    const baseSpeed = car.userData.speed;
    const gravitySpeed = baseSpeed / Math.sqrt(Math.max(simState.gravity, 0.12));
    const speed = gravitySpeed * (1 + noGrip * 3.5 + thinAir * 0.35 - Math.max(0, simState.airResistance - 1) * 0.2 - flood * 0.45);
    const horizontalLimit = 50;
    const verticalLimit = 40;
    const limit = car.userData.vertical ? verticalLimit : horizontalLimit;
    const direction = Math.sign(speed) || 1;
    const nextTravel = car.userData.travel + speed * dt * 10;
    const redLightStop = shouldStopAtRed(car, nextTravel, direction, time);
    const trafficStop = shouldStopForTraffic(car, direction, limit);
    car.userData.stopped = redLightStop || trafficStop;
    if (!car.userData.stopped || noGrip > 0.65) car.userData.travel = nextTravel;
    const offset = wrapLane(car.userData.travel, limit);
    const lateralSkid = Math.sin(time * 3.5 + index) * noGrip;
    const windPush = simState.wind * Math.sin(time * 2 + index) + magneticDisruption * Math.sin(time * 3 + index) * 0.6;
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
    if (!car.userData.stopped || noGrip > 0.65) {
      car.userData.rollingParts.forEach((part) => {
        part.rotation.z -= speed * dt * 8;
      });
    }
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
    data.progress = (data.progress + data.speed * 58 * dt * Math.max(0.25, simState.friction) / Math.sqrt(Math.max(simState.gravity, 0.2)) * Math.max(0.18, 1 - flood * 0.55)) % 1;
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
    water.scale.setScalar((boiling ? 0.88 + Math.sin(time * 3) * 0.02 : 1) * simState.waterLevel);
    water.position.y = 0.12 + flood * 0.75;
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

  homes.forEach((home, index) => {
    const resident = home.userData.resident;
    if (resident) {
      resident.position.x = Math.sin(time * 0.8 + home.userData.phase) * 0.75;
      resident.rotation.y = Math.sin(time * 0.6 + index) * 0.8;
    }
  });

  updateDisasterObjects(time);

  sun.intensity = (simState.atmosphere < 0.2 ? 5.5 : simState.oxygen < 8 ? 3.6 : 4.2) * simState.sunlight;
  ambient.intensity = (simState.atmosphere < 0.2 ? 0.55 : 1.6) * (0.45 + simState.sunlight * 0.55);
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

function trafficState(axis, time) {
  const phase = time % 20;
  if (axis === "h") {
    if (phase < 8) return "green";
    if (phase < 10) return "yellow";
    return "red";
  }
  if (phase < 8) return "red";
  if (phase < 10) return "red";
  if (phase < 18) return "green";
  return "yellow";
}

function updateTrafficLights(time) {
  trafficLights.forEach((light) => {
    const state = trafficState(light.userData.axis, time);
    Object.entries(light.userData.bulbs).forEach(([name, bulb]) => {
      const active = name === state;
      bulb.material.emissiveIntensity = active ? 2.2 : 0.14;
      bulb.scale.setScalar(active ? 1.16 : 1);
    });
  });
}

function shouldStopAtRed(car, nextTravel, direction, time) {
  const axis = car.userData.vertical ? "v" : "h";
  const state = trafficState(axis, time);
  if (state === "green") return false;
  const stopPoints = car.userData.vertical ? [-28, 0, 28] : [-32, 0, 32];
  const current = car.userData.vertical ? car.position.z : car.position.x;
  const next = wrapLane(nextTravel, car.userData.vertical ? 40 : 50);
  return stopPoints.some((point) => {
    const stopLine = point - direction * 5.6;
    const currentDistance = (stopLine - current) * direction;
    const nextDistance = (stopLine - next) * direction;
    const closeToIntersection = Math.abs((point - current) * direction) < 13;
    return closeToIntersection && currentDistance >= -0.8 && nextDistance <= 0.8;
  });
}

function shouldStopForTraffic(car, direction, limit) {
  const span = limit * 2;
  return cars.some((other) => {
    if (other === car) return false;
    if (other.userData.vertical !== car.userData.vertical) return false;
    if (Math.sign(other.userData.speed) !== Math.sign(car.userData.speed)) return false;
    const sameLane = car.userData.vertical
      ? Math.abs(other.userData.laneX - car.userData.laneX) < 0.2
      : Math.abs(other.userData.laneZ - car.userData.laneZ) < 0.2;
    if (!sameLane) return false;
    let distance = direction > 0
      ? other.userData.travel - car.userData.travel
      : car.userData.travel - other.userData.travel;
    distance = ((distance % span) + span) % span;
    return distance > 0.5 && distance < 7.8;
  });
}

function applyPreset(name) {
  const next = { ...defaultState(), prompt: `Preset: ${name}` };
  if (name === "moon") Object.assign(next, { gravity: 0.16, atmosphere: 0.03, oxygen: 0, airResistance: 0.02, sunlight: 1.3 });
  if (name === "mars") Object.assign(next, { gravity: 0.38, atmosphere: 0.25, oxygen: 1, airResistance: 0.2, temperatureF: -20, waterLevel: 0.35 });
  if (name === "underwater") Object.assign(next, { waterLevel: 2.2, friction: 0.25, airResistance: 1.8, oxygen: 6, sunlight: 0.45 });
  if (name === "iceage") Object.assign(next, { temperatureF: -10, friction: 0.18, sunlight: 0.55, waterLevel: 0.6 });
  if (name === "nofriction") Object.assign(next, { friction: 0 });
  if (name === "supergravity") Object.assign(next, { gravity: 3.2, friction: 1.2 });
  if (name === "toxic") Object.assign(next, { oxygen: 7, atmosphere: 1.6, acidity: 1, sunlight: 0.65 });
  setScenario(next);
}

function triggerDisaster(name) {
  const disasterNames = {
    meteor: "meteor strike",
    tsunami: "tsunami",
    solar: "solar flare",
    storm: "extreme storm",
    volcano: "volcanic eruption",
    radiation: "radiation leak"
  };
  simState.disaster = disasterNames[name] || name.replace("-", " ");
  if (name === "meteor") simState.earthquake = Math.max(simState.earthquake, 1);
  if (name === "tsunami") simState.waterLevel = Math.max(simState.waterLevel, 2.1);
  if (name === "solar") {
    simState.sunlight = Math.max(simState.sunlight, 1.9);
    simState.magnetism = Math.max(simState.magnetism, 2.6);
  }
  if (name === "storm") simState.wind = Math.max(simState.wind, 1.25);
  if (name === "volcano") {
    simState.temperatureF = Math.max(simState.temperatureF, 105);
    simState.acidity = 1;
    simState.sunlight = Math.min(simState.sunlight, 0.45);
  }
  if (name === "radiation") simState.magnetism = Math.max(simState.magnetism, 2.2);
  createDisasterVisual(name);
  updateReadout();
}

function createDisasterVisual(name) {
  disasterObjects.forEach((object) => world.remove(object));
  disasterObjects.length = 0;
  if (name === "meteor") {
    const meteor = new THREE.Mesh(new THREE.SphereGeometry(1.7, 24, 16), new THREE.MeshStandardMaterial({ color: 0x7c2d12, emissive: 0xf97316, emissiveIntensity: 1.2 }));
    meteor.position.set(-28, 34, -20);
    disasterObjects.push(meteor);
    world.add(meteor);
  }
  if (name === "tsunami") {
    const wave = box(92, 6, 2.2, new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.58 }), 0, 1.2, 43);
    wave.name = "tsunamiWave";
    disasterObjects.push(wave);
    world.add(wave);
  }
  if (name === "solar") {
    const flare = new THREE.Mesh(new THREE.RingGeometry(18, 21, 48), new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    flare.position.set(0, 42, -30);
    flare.rotation.x = Math.PI / 2;
    disasterObjects.push(flare);
    world.add(flare);
  }
  if (name === "storm" || name === "volcano" || name === "radiation") {
    const haze = new THREE.Mesh(new THREE.SphereGeometry(42, 32, 18), new THREE.MeshBasicMaterial({ color: name === "radiation" ? 0x84cc16 : 0x64748b, transparent: true, opacity: 0.09, side: THREE.BackSide }));
    haze.position.set(0, 16, 0);
    disasterObjects.push(haze);
    world.add(haze);
  }
}

function updateDisasterObjects(time) {
  disasterObjects.forEach((object) => {
    if (object.name === "tsunamiWave") object.position.z = 43 - ((time * 4) % 72);
    else {
      object.rotation.y += 0.01;
      object.position.y += Math.sin(time * 2) * 0.005;
    }
  });
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
  const realDt = lastFrameMs ? Math.min(0.08, (timeMs - lastFrameMs) / 1000) : 0.016;
  lastFrameMs = timeMs;
  if (!paused) simClock += realDt * timeScale;
  applySimulation(simClock);
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

universalControls?.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-rule]");
  if (!input) return;
  const rule = input.dataset.rule;
  simState[rule] = Number(input.value);
  simState.prompt = `Manual lab controls: ${rule} changed`;
  updateReadout();
});

presetGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-preset]");
  if (!button) return;
  applyPreset(button.dataset.preset);
  presetGrid.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
});

eventGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-event]");
  if (!button) return;
  triggerDisaster(button.dataset.event);
  eventGrid.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
});

missionList?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mission]");
  if (!button) return;
  activeMission = button.textContent.trim();
  simState.mission = button.dataset.mission;
  missionList.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  if (button.dataset.mission === "gravity-city") {
    simState.gravity = Math.max(simState.gravity, 2);
  }
  if (button.dataset.mission === "heat-grid") {
    simState.temperatureF = Math.max(simState.temperatureF, 112);
    simState.sunlight = Math.max(simState.sunlight, 1.4);
  }
  if (button.dataset.mission === "mars-transport") {
    simState.gravity = 0.38;
    simState.atmosphere = 0.25;
    simState.oxygen = Math.min(simState.oxygen, 2);
  }
  updateReadout();
});

timeControls?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-time]");
  if (!button) return;
  const value = button.dataset.time;
  if (value === "pause") {
    paused = !paused;
  } else {
    paused = false;
    timeScale = Number(value);
  }
  timeControls.querySelectorAll("button").forEach((item) => {
    item.classList.toggle("active", item === button && (value !== "pause" || paused));
    if (item.dataset.time === "pause" && item !== button) item.textContent = "Pause";
  });
  button.textContent = value === "pause" ? (paused ? "Resume" : "Pause") : button.textContent;
});

scaleSwitcher?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-scale]");
  if (!button) return;
  setCameraScale(button.dataset.scale);
});

resetButton.addEventListener("click", () => {
  promptInput.value = "What if gravity became 2x stronger?";
  setScenario(defaultState());
  previousSimTime = 0;
  simClock = 0;
  lastFrameMs = 0;
  timeScale = 1;
  paused = false;
  activeMission = "";
  createWorld();
  setFullCityView();
  const pauseButton = timeControls?.querySelector('button[data-time="pause"]');
  if (pauseButton) pauseButton.textContent = "Pause";
  timeControls?.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
  presetGrid?.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
  eventGrid?.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
  missionList?.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
  updateReadout();
});

window.addEventListener("resize", resize);

createWorld();
promptInput.value = simState.prompt;
setScenario(simState);
setFullCityView();
resize();
requestAnimationFrame(animate);
