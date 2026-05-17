const video = document.querySelector("#cameraFeed");
const uploadedFrame = document.querySelector("#uploadedFrame");
const canvas = document.querySelector("#overlayCanvas");
const ctx = canvas.getContext("2d");
const startButtons = [document.querySelector("#startCamera"), document.querySelector("#startCameraNav")];
const flipCameraButton = document.querySelector("#flipCamera");
const uploadInput = document.querySelector("#imageUpload");
const objectTypeSelect = document.querySelector("#objectType");
const statusText = document.querySelector("#scannerStatus");
const activeObject = document.querySelector("#activeObject");
const activeSummary = document.querySelector("#activeSummary");
const confidenceReadout = document.querySelector("#confidenceReadout");
const motionReadout = document.querySelector("#motionReadout");
const forceReadout = document.querySelector("#forceReadout");
const microReadout = document.querySelector("#microReadout");
const conceptNotes = document.querySelector("#conceptNotes");
const conceptChips = document.querySelector("#conceptChips");
const conceptExplainTitle = document.querySelector("#conceptExplainTitle");
const conceptExplainCopy = document.querySelector("#conceptExplainCopy");
const formulaStrip = document.querySelector("#formulaStrip");
const scienceToolbar = document.querySelector("#scienceToolbar");
const scanScore = document.querySelector("#scanScore");
const whatIfLink = document.querySelector("#whatIfLink");
const analysisCanvas = document.createElement("canvas");
const analysisCtx = analysisCanvas.getContext("2d", { willReadFrequently: true });

const activeLayers = new Set(["forces", "energy", "motion", "materials", "micro"]);

const concepts = {
  person: {
    title: "Human body systems",
    summary: "Balance, gravity, shoe friction, muscle force, breathing, and body heat are mapped onto the person.",
    forces: ["weight", "normal force", "shoe friction", "muscle force"],
    material: "skin, bone, muscle, fabric, rubber soles",
    micro: "muscle fibers use oxygen and glucose to release ATP energy",
    energy: "chemical energy -> motion + heat",
    formulas: ["F = m x a", "Power = work/time", "glucose + O2 -> ATP"],
    notes: ["Center of mass shows balance.", "Ground contact shows friction and support.", "Energy layer connects motion to heat."]
  },
  sports: {
    title: "Projectile motion + spin",
    summary: "Gravity, velocity, spin, air drag, friction, bounce loss, and elastic energy are shown on the object.",
    forces: ["gravity", "applied force", "air drag", "friction"],
    material: "rubber, leather/synthetic shell, compressed air",
    micro: "elastic polymer stores and releases energy during bounce",
    energy: "kinetic energy <-> elastic energy + heat",
    formulas: ["KE = 1/2mv^2", "impulse = Fdt", "projectile motion"],
    notes: ["Gravity stays downward.", "Spin can curve the path.", "Bounces lose energy as heat and sound."]
  },
  bicycle: {
    title: "Wheel + rotational motion",
    summary: "The scanner highlights torque, rolling friction, wheel rotation, spoke tension, and energy transfer.",
    forces: ["torque", "rolling friction", "normal force", "centripetal force"],
    material: "rubber tire, metal frame, chain, bearings",
    micro: "rubber grip and metal spoke tension distribute force",
    energy: "leg work -> rotational kinetic energy -> heat",
    formulas: ["torque = rF", "v = omega r", "friction = mu N"],
    notes: ["Wheel arrows show rotation.", "Contact patch shows traction.", "Spokes carry load in tension."]
  },
  car: {
    title: "Transportation physics",
    summary: "Thrust, drag, tire friction, braking heat, gravity, and material structure are shown on the vehicle.",
    forces: ["engine thrust", "air drag", "tire friction", "normal force"],
    material: "metal body, glass, rubber, plastic, battery/fuel",
    micro: "rubber tread, metal chassis, glass, battery or combustion chemistry",
    energy: "fuel/electricity -> kinetic energy + heat + sound",
    formulas: ["drag rises with v^2", "friction = mu N", "KE = 1/2mv^2"],
    notes: ["Drag points opposite motion.", "Tires need friction to accelerate.", "Braking turns motion into heat."]
  },
  bottle: {
    title: "Pressure + materials",
    summary: "Pressure, gravity, surface tension, condensation, and container material are shown.",
    forces: ["internal pressure", "gravity", "normal force", "surface tension"],
    material: "plastic polymer or aluminum shell, liquid, gas",
    micro: "polymer chains or metal crystal lattice resist pressure",
    energy: "pressure energy + thermal energy",
    formulas: ["Pressure = F/A", "density = mass/volume", "CO2(aq) -> CO2(g)"],
    notes: ["Pressure pushes outward.", "Condensation depends on temperature.", "Shape controls strength."]
  },
  cup: {
    title: "Fluids + heat transfer",
    summary: "Liquid level, buoyancy, surface tension, conduction, convection, and evaporation are mapped.",
    forces: ["gravity", "buoyancy", "support force", "surface tension"],
    material: "ceramic/plastic/metal plus liquid",
    micro: "water molecules, dissolved particles, and vapor molecules",
    energy: "thermal energy moves by conduction and evaporation",
    formulas: ["Q = mcDT", "buoyancy = displaced fluid weight", "evaporation removes heat"],
    notes: ["Convection circulates fluid.", "Surface tension shapes droplets.", "Evaporation cools the liquid."]
  },
  book: {
    title: "Paper + compression",
    summary: "Weight, page friction, compression, cellulose fibers, ink chemistry, and light reflection are shown.",
    forces: ["weight", "normal force", "page friction", "compression"],
    material: "paper fibers, glue, ink, cover coating",
    micro: "cellulose fibers and ink pigments form the page structure",
    energy: "light reflection + heat from page motion",
    formulas: ["stress = F/A", "friction = mu N", "reflection depends on texture"],
    notes: ["Compression travels through the stack.", "Pages resist sliding because of friction.", "Fibers give paper strength."]
  },
  electronics: {
    title: "Circuits + heat flow",
    summary: "Electric current, chips, battery power, screen light, and heat production are shown.",
    forces: ["weight", "support force", "button/contact force"],
    material: "glass, plastic/metal shell, copper traces, silicon chips",
    micro: "silicon transistors and copper traces move electric charge",
    energy: "electric energy -> light + computation + heat",
    formulas: ["P = IV", "V = IR", "Q = mcDT"],
    notes: ["Current paths carry energy.", "Chips release heat.", "Screens convert electricity into light."]
  },
  fan: {
    title: "Airflow + motor physics",
    summary: "The fan shows motor torque, rotating blades, air pressure differences, drag, and electrical energy transfer.",
    forces: ["motor torque", "air drag", "centripetal force", "support force"],
    material: "plastic/metal blades, copper coils, magnets, bearings",
    micro: "copper coils and magnetic fields create motor rotation",
    energy: "electric energy -> rotational motion -> moving air + heat",
    formulas: ["torque = rF", "Power = IV", "airflow = area x velocity"],
    notes: ["Spinning blades push air forward.", "Motors convert electricity into rotation.", "Drag resists blade motion."]
  },
  shoe: {
    title: "Friction + materials",
    summary: "The shoe shows grip, normal force, pressure distribution, foam cushioning, and rubber material science.",
    forces: ["weight", "normal force", "friction", "compression"],
    material: "rubber outsole, foam midsole, fabric/leather upper",
    micro: "rubber texture increases grip while foam cells absorb impact",
    energy: "impact energy -> elastic compression + heat",
    formulas: ["friction = mu N", "pressure = F/A", "elastic energy"],
    notes: ["Tread increases friction.", "Foam spreads impact force.", "Grip depends on surface texture."]
  },
  bulb: {
    title: "Light + electricity",
    summary: "The light bulb shows electric power, light emission, heat loss, glass, conductors, and electromagnetic radiation.",
    forces: ["support force", "thermal expansion", "electric field effects"],
    material: "glass, metal contacts, LED/filament, phosphor coating",
    micro: "electrons release energy as photons in LEDs or hot filaments",
    energy: "electric energy -> light + heat",
    formulas: ["P = IV", "photon energy = hf", "efficiency = light output/input"],
    notes: ["Electric energy becomes photons.", "Some energy becomes heat.", "Materials control brightness and color."]
  },
  appliance: {
    title: "Appliance energy transfer",
    summary: "Motors, coils, heat, insulation, vibration, and power use are shown.",
    forces: ["weight", "support force", "motor torque", "vibration"],
    material: "steel shell, copper wiring, plastic insulation, glass/ceramic",
    micro: "copper coils, magnets, insulation, and bearings transfer energy",
    energy: "electric energy -> heat/motion/sound",
    formulas: ["Power = energy/time", "torque = rF", "efficiency = output/input"],
    notes: ["Coils move electric energy.", "Motors create torque.", "Waste heat shows efficiency losses."]
  },
  plumbing: {
    title: "Fluids + pressure",
    summary: "Water flow, pipe pressure, drainage, turbulence, gravity, and material corrosion are shown.",
    forces: ["water pressure", "gravity", "viscous drag", "support force"],
    material: "ceramic, metal, rubber seals, water, minerals",
    micro: "water molecules and dissolved minerals interact with surfaces",
    energy: "pressure energy -> flow + turbulence + sound",
    formulas: ["Pressure = F/A", "flow = area x velocity", "drag rises with speed"],
    notes: ["Pressure drives flow.", "Gravity pulls water down drains.", "Minerals can build up on surfaces."]
  },
  plant: {
    title: "Plant biology",
    summary: "Photosynthesis, water transport, transpiration, cellulose structure, and wind loading are shown.",
    forces: ["gravity", "stem support", "wind force", "water tension"],
    material: "cellulose, water, chlorophyll, leaf and bark tissue",
    micro: "chloroplasts, stomata, xylem tubes, and cellulose cell walls",
    energy: "sunlight -> chemical energy + oxygen",
    formulas: ["CO2 + H2O + light -> sugar + O2", "capillary action", "transpiration pull"],
    notes: ["Xylem moves water upward.", "Leaves store sunlight as sugar.", "Stems resist bending."]
  },
  furniture: {
    title: "Structures + load paths",
    summary: "Compression, bending, friction at contact points, stability, and material stiffness are shown.",
    forces: ["weight", "normal force", "compression", "friction"],
    material: "wood, metal, plastic, fabric, foam, fasteners",
    micro: "wood grain, fibers, foam cells, or metal lattice carry load",
    energy: "elastic energy + heat from friction",
    formulas: ["stress = F/A", "torque = rF", "friction = mu N"],
    notes: ["Load travels to the floor.", "Wide bases improve stability.", "Materials bend by different amounts."]
  },
  animal: {
    title: "Biomechanics",
    summary: "Posture, muscles, joints, breathing, body heat, and ground reaction forces are shown.",
    forces: ["weight", "ground reaction", "joint torque", "muscle force"],
    material: "bone, muscle, connective tissue, skin/fur",
    micro: "muscle fibers, nerves, blood oxygen, and tissue structure",
    energy: "food energy -> muscle work -> body heat",
    formulas: ["F = m x a", "torque = rF", "metabolism releases heat"],
    notes: ["Joint torque moves limbs.", "Ground force supports the body.", "Muscles turn food energy into motion."]
  },
  weather: {
    title: "Atmosphere + weather",
    summary: "Air pressure, water vapor, condensation, wind, sunlight, and heat transfer are shown.",
    forces: ["pressure gradient", "wind drag", "gravity on droplets", "buoyancy"],
    material: "air, water vapor, droplets, aerosols, sunlight",
    micro: "water vapor condenses around tiny aerosol particles",
    energy: "sunlight -> heat -> convection + phase change",
    formulas: ["PV = nRT", "condensation releases heat", "wind follows pressure gradients"],
    notes: ["Air flows from pressure differences.", "Cloud droplets form by condensation.", "Sunlight drives convection."]
  },
  default: {
    title: "Real-world physics scan",
    summary: "DLS estimates forces, energy transfer, material structure, and microscopic behavior from the selected object region.",
    forces: ["gravity", "support force", "friction", "motion/drag"],
    material: "solid surface, coating, and internal structure",
    micro: "microscopic structure depends on the object's material",
    energy: "stored energy + motion energy + heat exchange",
    formulas: ["F = m x a", "KE = 1/2mv^2", "Pressure = F/A"],
    notes: ["The box anchors science to the object area.", "Center of mass is estimated from shape.", "Motion trails appear when the object moves."]
  }
};

const aliases = {
  "sports ball": "sports",
  frisbee: "sports",
  skateboard: "bicycle",
  motorcycle: "bicycle",
  truck: "car",
  bus: "car",
  train: "car",
  bottle: "bottle",
  "wine glass": "cup",
  cup: "cup",
  bowl: "cup",
  book: "book",
  laptop: "electronics",
  tv: "electronics",
  remote: "electronics",
  mouse: "electronics",
  keyboard: "electronics",
  "cell phone": "electronics",
  microwave: "appliance",
  fan: "fan",
  shoe: "shoe",
  sneaker: "shoe",
  "light bulb": "bulb",
  oven: "appliance",
  toaster: "appliance",
  refrigerator: "appliance",
  sink: "plumbing",
  toilet: "plumbing",
  "potted plant": "plant",
  chair: "furniture",
  couch: "furniture",
  bed: "furniture",
  dog: "animal",
  cat: "animal",
  bird: "animal",
  horse: "animal",
  sheep: "animal",
  cow: "animal",
  umbrella: "weather",
  kite: "weather",
  "real object": "default",
  auto: "default"
};

let stream = null;
let cameraOn = false;
let sourceMode = "ready";
let facingMode = "environment";
let rafId = 0;
let phase = 0;
let lastTime = performance.now();
let lastCenter = null;
let motionSpeed = 0;
let trackedPrediction = null;
let earnedObjects = new Set(JSON.parse(localStorage.getItem("dls-scanned-objects") || "[]"));
let cocoModel = null;
let mobileNetModel = null;
let tfPrediction = null;
let tfBusy = false;
let lastTfScan = 0;

const conceptExplainers = {
  gravity: "Gravity pulls objects toward Earth. In a scan, the downward arrow shows weight: the force caused by gravity acting on mass.",
  "projectile motion": "Projectile motion is curved motion caused by forward velocity plus downward gravity. Balls, water drops, and tossed objects follow this pattern.",
  friction: "Friction is the contact force that resists sliding. Shoes, tires, pages, and balls all depend on friction to grip or slow down.",
  "kinetic energy": "Kinetic energy is energy of motion. Faster or heavier objects have more kinetic energy and need more force to stop.",
  "air drag": "Air drag is resistance from air pushing against moving objects. It grows quickly as speed increases.",
  torque: "Torque is turning force. Wheels, fans, gears, hinges, and pedals all use torque to rotate.",
  pressure: "Pressure is force spread over area. Smaller contact areas create higher pressure.",
  "heat transfer": "Heat transfer moves thermal energy by conduction, convection, radiation, or evaporation.",
  electricity: "Electricity moves charge through circuits. Devices convert electrical energy into motion, light, sound, computation, or heat.",
  materials: "Material science explains how structure, texture, stiffness, and chemistry change what an object can do.",
  microscopic: "The microscopic layer connects visible behavior to atoms, molecules, fibers, cells, or crystals inside the object."
};

function selectedLabel() {
  const value = objectTypeSelect?.value || "auto";
  return value === "auto" ? "real object" : value;
}

async function loadTensorFlowModels() {
  statusText.textContent = "Loading TensorFlow.js detector...";
  try {
    if (!window.cocoSsd) throw new Error("COCO-SSD unavailable");
    cocoModel = await cocoSsd.load();
    if (window.mobilenet) {
      try {
        mobileNetModel = await mobilenet.load();
      } catch (error) {
        mobileNetModel = null;
      }
    }
    statusText.textContent = "TensorFlow.js ready. Scan an object.";
  } catch (error) {
    statusText.textContent = "TensorFlow.js unavailable. Diagrams still work with local scan.";
  }
}

function conceptFor(label) {
  return concepts[aliases[label] || label] || concepts.default;
}

function setCanvasSize(width = 1280, height = 720) {
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
}

function objectBox(width, height) {
  const manualLabel = selectedLabel();
  const detected = tfPrediction || detectObjectFromFrame(width, height);
  const label = manualLabel === "real object" ? detected.label : manualLabel;
  if (detected) {
    const next = { ...detected, label, score: manualLabel === "real object" ? detected.score : 0.98 };
    if (!trackedPrediction) {
      trackedPrediction = next;
    } else {
      trackedPrediction = {
        ...next,
        bbox: smoothBox(trackedPrediction.bbox, next.bbox, 0.28)
      };
    }
    return trackedPrediction;
  }

  const vertical = width < height;
  let boxWidth = width * (vertical ? 0.64 : 0.48);
  let boxHeight = height * (vertical ? 0.42 : 0.54);

  if (["person", "bottle", "cell phone"].includes(label)) {
    boxWidth = width * (vertical ? 0.42 : 0.26);
    boxHeight = height * 0.72;
  }
  if (["sports ball"].includes(label)) {
    const size = Math.min(width, height) * 0.38;
    boxWidth = size;
    boxHeight = size;
  }
  if (["bicycle", "car"].includes(label)) {
    boxWidth = width * 0.62;
    boxHeight = height * 0.36;
  }
  if (["potted plant"].includes(label)) {
    boxWidth = width * 0.42;
    boxHeight = height * 0.62;
  }
  if (["fan", "sports ball"].includes(label)) {
    const size = Math.min(width, height) * 0.42;
    boxWidth = size;
    boxHeight = size;
  }
  if (["shoe"].includes(label)) {
    boxWidth = width * 0.54;
    boxHeight = height * 0.26;
  }
  if (["light bulb"].includes(label)) {
    boxWidth = width * 0.28;
    boxHeight = height * 0.5;
  }

  const cx = width * 0.5 + Math.sin(phase * 0.7) * width * 0.015;
  const cy = height * 0.52 + Math.cos(phase * 0.5) * height * 0.012;
  return {
    label,
    score: 0.94,
    bbox: [
      clamp(cx - boxWidth / 2, 8, width - boxWidth - 8),
      clamp(cy - boxHeight / 2, 8, height - boxHeight - 8),
      boxWidth,
      boxHeight
    ]
  };
}

function detectObjectFromFrame(width, height) {
  const source = sourceMode === "camera" && video.videoWidth ? video :
    sourceMode === "upload" && uploadedFrame.naturalWidth ? uploadedFrame :
      null;
  if (!source) return null;

  const sampleWidth = 180;
  const sampleHeight = Math.max(90, Math.round(sampleWidth * height / width));
  analysisCanvas.width = sampleWidth;
  analysisCanvas.height = sampleHeight;
  try {
    analysisCtx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
  } catch (error) {
    return null;
  }

  const { data } = analysisCtx.getImageData(0, 0, sampleWidth, sampleHeight);
  const stats = imageStats(data);
  let minX = sampleWidth;
  let minY = sampleHeight;
  let maxX = 0;
  let maxY = 0;
  let hits = 0;
  let greenHits = 0;
  let skinHits = 0;
  let darkHits = 0;
  let brightHits = 0;
  let colorHits = 0;

  for (let y = 2; y < sampleHeight - 2; y += 1) {
    for (let x = 2; x < sampleWidth - 2; x += 1) {
      const i = (y * sampleWidth + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = luminance(r, g, b);
      const sat = saturation(r, g, b);
      const right = i + 4;
      const down = ((y + 1) * sampleWidth + x) * 4;
      const edge = Math.abs(lum - luminance(data[right], data[right + 1], data[right + 2])) +
        Math.abs(lum - luminance(data[down], data[down + 1], data[down + 2]));
      const central = x > sampleWidth * 0.06 && x < sampleWidth * 0.94 && y > sampleHeight * 0.06 && y < sampleHeight * 0.94;
      const interesting = central && (Math.abs(lum - stats.avgLum) > 28 || sat > stats.avgSat + 0.14 || edge > 38);
      if (!interesting) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      hits += 1;
      if (g > r * 1.12 && g > b * 1.12 && sat > 0.2) greenHits += 1;
      if (r > 95 && g > 55 && b > 35 && r > b * 1.25 && g > b * 0.9) skinHits += 1;
      if (lum < 70) darkHits += 1;
      if (lum > 185) brightHits += 1;
      if (sat > 0.35) colorHits += 1;
    }
  }

  const totalPixels = sampleWidth * sampleHeight;
  if (hits < totalPixels * 0.012 || maxX <= minX || maxY <= minY) return null;

  const padX = sampleWidth * 0.045;
  const padY = sampleHeight * 0.055;
  minX = clamp(minX - padX, 0, sampleWidth);
  minY = clamp(minY - padY, 0, sampleHeight);
  maxX = clamp(maxX + padX, 0, sampleWidth);
  maxY = clamp(maxY + padY, 0, sampleHeight);

  const scaleX = width / sampleWidth;
  const scaleY = height / sampleHeight;
  const box = [
    minX * scaleX,
    minY * scaleY,
    Math.max(width * 0.14, (maxX - minX) * scaleX),
    Math.max(height * 0.14, (maxY - minY) * scaleY)
  ];
  box[0] = clamp(box[0], 4, width - box[2] - 4);
  box[1] = clamp(box[1], 4, height - box[3] - 4);

  return {
    label: classifyLocalObject(box, width, height, {
      hits,
      greenRatio: greenHits / hits,
      skinRatio: skinHits / hits,
      darkRatio: darkHits / hits,
      brightRatio: brightHits / hits,
      colorRatio: colorHits / hits
    }),
    score: 0.88,
    bbox: box
  };
}

function imageStats(data) {
  let lum = 0;
  let sat = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    lum += luminance(data[i], data[i + 1], data[i + 2]);
    sat += saturation(data[i], data[i + 1], data[i + 2]);
  }
  return { avgLum: lum / pixels, avgSat: sat / pixels };
}

function classifyLocalObject(box, frameWidth, frameHeight, stats) {
  const aspect = box[2] / box[3];
  const area = (box[2] * box[3]) / (frameWidth * frameHeight);
  const tall = aspect < 0.95 && area > 0.1;
  const veryTall = aspect < 0.72 && area > 0.07;
  const webcamPerson = sourceMode === "camera" && area > 0.18 && aspect < 1.35;
  if (stats.skinRatio > 0.06 && aspect < 1.35 && area > 0.05) return "person";
  if (veryTall || (tall && stats.darkRatio > 0.12) || webcamPerson) return "person";
  if (stats.greenRatio > 0.26) return "potted plant";
  if (aspect > 2.1 && area > 0.08) return stats.darkRatio > 0.22 ? "car" : "bicycle";
  if (aspect > 1.55 && area > 0.2) return "car";
  if (aspect < 0.55 && area > 0.12) return stats.brightRatio > 0.22 ? "bottle" : "person";
  if (aspect < 0.72 && area < 0.16) return stats.darkRatio > 0.24 ? "cell phone" : "bottle";
  if (Math.abs(aspect - 1) < 0.28 && area < 0.18 && stats.colorRatio > 0.18) return "sports ball";
  if (Math.abs(aspect - 1) < 0.32 && area < 0.22 && stats.darkRatio > 0.18) return "fan";
  if (stats.brightRatio > 0.35 && aspect > 0.8 && aspect < 1.5) return "book";
  if (stats.darkRatio > 0.34 && area < 0.25) return "electronics";
  return "real object";
}

function smoothBox(previous, next, amount) {
  return previous.map((value, index) => value + (next[index] - value) * amount);
}

function luminance(r, g, b) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function saturation(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return max === 0 ? 0 : (max - min) / max;
}

async function startCamera() {
  try {
    stopCamera();
    trackedPrediction = null;
    tfPrediction = null;
    lastCenter = null;
    statusText.textContent = "Requesting camera...";
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
    uploadedFrame.style.display = "none";
    video.style.display = "block";
    await video.play();
    cameraOn = true;
    sourceMode = "camera";
    statusText.textContent = "Camera scanning. Diagrams are active.";
    startLoop();
  } catch (error) {
    statusText.textContent = "Camera blocked. Upload an image, or allow camera permission.";
    cameraOn = false;
    sourceMode = "ready";
    drawFrame();
  }
}

function stopCamera() {
  cameraOn = false;
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
}

async function flipCamera() {
  facingMode = facingMode === "environment" ? "user" : "environment";
  await startCamera();
}

function startLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  const loop = () => {
    drawFrame();
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

function drawFrame() {
  const now = performance.now();
  const dt = Math.max(0.016, (now - lastTime) / 1000);
  lastTime = now;
  phase += dt;

  let width = 1280;
  let height = 720;
  if (sourceMode === "camera" && video.videoWidth && video.videoHeight) {
    width = video.videoWidth;
    height = video.videoHeight;
  }
  if (sourceMode === "upload" && uploadedFrame.naturalWidth && uploadedFrame.naturalHeight) {
    width = uploadedFrame.naturalWidth;
    height = uploadedFrame.naturalHeight;
  }
  if (canvas.width !== width || canvas.height !== height) setCanvasSize(width, height);
  maybeRunTensorFlowScan();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(width, height);
  const prediction = objectBox(width, height);
  const center = centerOf(prediction);
  if (lastCenter) motionSpeed = Math.hypot(center.x - lastCenter.x, center.y - lastCenter.y) / dt;
  lastCenter = center;
  drawScience(prediction, motionSpeed);
  updatePanel(prediction, motionSpeed);
}

async function maybeRunTensorFlowScan() {
  const source = sourceMode === "camera" && video.videoWidth ? video :
    sourceMode === "upload" && uploadedFrame.naturalWidth ? uploadedFrame :
      null;
  if (!source || !cocoModel || tfBusy) return;
  const now = performance.now();
  if (sourceMode === "camera" && now - lastTfScan < 700) return;
  if (sourceMode === "upload" && tfPrediction) return;
  lastTfScan = now;
  tfBusy = true;
  try {
    const width = sourceMode === "camera" ? video.videoWidth : uploadedFrame.naturalWidth;
    const height = sourceMode === "camera" ? video.videoHeight : uploadedFrame.naturalHeight;
    const detections = await cocoModel.detect(source);
    const best = pickBestDetection(detections, width, height);
    let refinedLabel = best?.class || "";
    if (mobileNetModel && (!refinedLabel || refinedLabel === "sports ball" || refinedLabel === "bottle")) {
      refinedLabel = refineWithMobileNet(await mobileNetModel.classify(source), refinedLabel);
    }
    if (best) {
      tfPrediction = {
        label: refinedLabel || best.class,
        score: best.score,
        bbox: best.bbox
      };
    }
  } catch (error) {
    tfPrediction = null;
  } finally {
    tfBusy = false;
  }
}

function pickBestDetection(detections, width, height) {
  const useful = detections
    .filter((item) => item.score > 0.45)
    .filter((item) => item.bbox[2] * item.bbox[3] > width * height * 0.015)
    .sort((a, b) => (b.score * b.bbox[2] * b.bbox[3]) - (a.score * a.bbox[2] * a.bbox[3]));
  return useful[0] || null;
}

function refineWithMobileNet(classifications, fallbackLabel) {
  const text = classifications.map((item) => item.className.toLowerCase()).join(" ");
  if (/basketball|volleyball|soccer|tennis|ping-pong|rugby|football|ball/.test(text)) return "sports ball";
  if (/water bottle|pop bottle|can|soda|beer bottle|wine bottle/.test(text)) return "bottle";
  if (/running shoe|sneaker|shoe|loafer|sandal/.test(text)) return "shoe";
  if (/cellular telephone|mobile phone|iphone|phone/.test(text)) return "cell phone";
  if (/laptop|notebook|computer|keyboard|monitor|screen/.test(text)) return "laptop";
  if (/microwave/.test(text)) return "microwave";
  if (/electric fan|fan/.test(text)) return "fan";
  if (/light bulb|lamp/.test(text)) return "light bulb";
  if (/plant|tree|flower|pot/.test(text)) return "potted plant";
  return fallbackLabel || "";
}

function drawGrid(width, height) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#67e8f9";
  ctx.lineWidth = 1;
  const step = Math.max(48, Math.min(width, height) / 10);
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScience(prediction, speed) {
  const [x, y, w, h] = prediction.bbox;
  const center = centerOf(prediction);
  const concept = conceptFor(prediction.label);
  const color = "#14b8a6";
  drawFocusBox(x, y, w, h, color);

  if (activeLayers.has("energy")) drawEnergyField(x, y, w, h, concept.energy);
  if (activeLayers.has("forces")) {
    drawCenter(center.x, center.y, color);
    drawForces(prediction, concept, center, x, y, w, h);
  }
  if (activeLayers.has("motion")) {
    const vx = Math.cos(phase * 1.5) * Math.min(110, 40 + speed * 0.12);
    drawVector(center.x, center.y - h * 0.15, center.x + vx, center.y - h * 0.15, "#38bdf8", "motion", 0.9);
    drawVector(center.x + vx * 0.55, center.y - h * 0.25, center.x - vx * 0.2, center.y - h * 0.25, "#a78bfa", "drag", 0.75);
  }
  if (activeLayers.has("materials")) {
    drawStressBars(x, y, w, h, prediction.label);
    const materialX = x + w * 0.5 > canvas.width * 0.5 ? x - 360 : x + w + 32;
    drawCallout(x + w, y + h * 0.25, materialX, y + h * 0.12, "material", concept.material, "#facc15");
  }
  if (activeLayers.has("micro")) drawMicroInset(x, y, w, h, concept);
  const labelX = x + w * 0.5 > canvas.width * 0.5 ? x - 300 : x - 30;
  drawCallout(x, y, labelX, y - 24, prediction.label, "auto-adjusted box", color);
}

function drawForces(prediction, concept, center, x, y, w, h) {
  const label = prediction.label;
  drawVector(center.x, center.y, center.x, center.y + Math.min(h * 0.52, 130), "#f97316", "weight mg", 1.2);
  drawVector(center.x, y + h, center.x, y + h - Math.min(h * 0.42, 100), "#22c55e", "normal N", 1.05);
  if (label === "person") {
    drawVector(x + w * 0.34, y + h * 0.84, x + w * 0.52, y + h * 0.62, "#ec4899", "muscle force", 0.8);
    drawVector(x + w * 0.28, y + h * 0.94, x + w * 0.5, y + h * 0.94, "#eab308", "shoe friction", 0.85);
    return;
  }
  if (label === "sports ball") {
    drawSpinRing(center.x, center.y, Math.min(w, h) * 0.34);
    drawVector(center.x - w * 0.18, center.y + h * 0.12, center.x + w * 0.22, center.y - h * 0.1, "#38bdf8", "velocity", 0.85);
    return;
  }
  if (label === "bicycle" || label === "car") {
    drawVector(x + w * 0.18, y + h * 0.78, x + w * 0.52, y + h * 0.78, "#eab308", "tire traction", 0.9);
    drawVector(x + w * 0.72, y + h * 0.35, x + w * 0.45, y + h * 0.35, "#a78bfa", "air drag", 0.75);
    return;
  }
  if (label === "fan") {
    drawSpinRing(center.x, center.y, Math.min(w, h) * 0.36);
    drawVector(center.x, center.y, center.x + w * 0.3, center.y, "#38bdf8", "airflow", 0.8);
    drawVector(center.x, center.y + h * 0.1, center.x, center.y - h * 0.25, "#facc15", "motor torque", 0.75);
    return;
  }
  if (label === "shoe") {
    drawVector(x + w * 0.18, y + h * 0.82, x + w * 0.62, y + h * 0.82, "#eab308", "grip friction", 0.9);
    drawVector(center.x, y + h * 0.12, center.x, y + h * 0.62, "#fb7185", "compression", 0.75);
    return;
  }
  if (label === "light bulb") {
    drawLightRays(center.x, center.y, Math.min(w, h) * 0.42);
    drawVector(center.x, y + h, center.x, center.y, "#facc15", "electric energy", 0.75);
    return;
  }
  if (label === "potted plant") {
    drawVector(center.x, y + h * 0.9, center.x, y + h * 0.28, "#22c55e", "xylem flow", 0.75);
    drawVector(x + w * 0.74, y + h * 0.22, x + w * 0.5, y + h * 0.18, "#facc15", "sunlight", 0.7);
    return;
  }
  if (label === "sink" || label === "cup" || label === "bottle") {
    drawVector(center.x, y + h * 0.18, center.x, y + h * 0.62, "#38bdf8", "fluid pressure", 0.75);
    drawVector(x + w * 0.25, y + h * 0.34, x + w * 0.62, y + h * 0.34, "#22d3ee", "flow", 0.7);
    return;
  }
  drawVector(x + w * 0.2, y + h * 0.86, x + w * 0.52, y + h * 0.86, "#eab308", "friction", 0.9);
}

function drawSpinRing(x, y, radius) {
  ctx.save();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(x, y, radius, phase * 2, phase * 2 + Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
}

function drawLightRays(x, y, radius) {
  ctx.save();
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 10; i += 1) {
    const angle = phase * 0.4 + i * Math.PI * 2 / 10;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.45, y + Math.sin(angle) * radius * 0.45);
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFocusBox(x, y, w, h, color) {
  const corner = Math.min(44, w * 0.24, h * 0.24);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 5;
  [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]].forEach(([px, py, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(px, py + sy * corner);
    ctx.lineTo(px, py);
    ctx.lineTo(px + sx * corner, py);
    ctx.stroke();
  });
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([10, 12]);
  roundRect(x, y, w, h, 18);
  ctx.stroke();
  ctx.restore();
}

function drawVector(x1, y1, x2, y2, color, label, weight = 1) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 13 + weight * 4;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3 + weight * 1.8;
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawPill(label, x2 + 8, y2 - 8, color);
}

function drawPill(text, x, y, color) {
  ctx.save();
  ctx.font = "800 15px Poppins, sans-serif";
  const width = Math.min(ctx.measureText(text).width + 22, 250);
  const px = clamp(x, 8, canvas.width - width - 8);
  const py = clamp(y, 34, canvas.height - 8);
  ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(px, py - 28, width, 34, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.fillText(text.slice(0, 32), px + 11, py - 7);
  ctx.restore();
}

function drawCallout(ax, ay, bx, by, title, detail, color) {
  const text = `${title}: ${detail}`;
  const maxWidth = Math.min(350, Math.max(180, text.length * 7.5));
  const x = clamp(bx, 8, canvas.width - maxWidth - 8);
  const y = clamp(by, 40, canvas.height - 42);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(x + 8, y - 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ax, ay, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.strokeStyle = color;
  roundRect(x, y - 34, maxWidth, 40, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "800 14px Poppins, sans-serif";
  ctx.fillText(text.slice(0, 46), x + 11, y - 9);
  ctx.restore();
}

function drawCenter(x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 14 + Math.sin(phase * 5) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 18, y);
  ctx.lineTo(x + 18, y);
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x, y + 18);
  ctx.stroke();
  ctx.restore();
}

function drawEnergyField(x, y, w, h, label) {
  const gradient = ctx.createRadialGradient(x + w / 2, y + h / 2, 8, x + w / 2, y + h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, "rgba(250, 204, 21, 0.34)");
  gradient.addColorStop(0.6, "rgba(20, 184, 166, 0.14)");
  gradient.addColorStop(1, "rgba(20, 184, 166, 0)");
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(x - w * 0.22, y - h * 0.22, w * 1.44, h * 1.44);
  ctx.restore();
  for (let i = 0; i < 6; i += 1) {
    const barHeight = 14 + (Math.sin(phase * 3 + i) + 1) * 9;
    ctx.fillStyle = i < 3 ? "#facc15" : "#14b8a6";
    roundRect(x + 12 + i * 14, y + h + 18 - barHeight, 8, barHeight, 4);
    ctx.fill();
  }
  drawPill(label.split(" -> ").slice(0, 2).join(" -> "), x + 8, y + h + 30, "#facc15");
}

function drawStressBars(x, y, w, h, label) {
  ctx.save();
  ctx.strokeStyle = "rgba(251, 113, 133, 0.92)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const count = label === "person" ? 4 : 7;
  for (let i = 0; i < count; i += 1) {
    const px = x + w * ((i + 1) / (count + 1));
    const top = y + h * 0.12;
    const bottom = y + h * (label === "person" ? 0.68 : 0.26);
    ctx.beginPath();
    ctx.moveTo(px, top);
    ctx.lineTo(px + Math.sin(phase * 2 + i) * 8, bottom);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMicroInset(x, y, w, h, concept) {
  const insetW = Math.min(270, canvas.width - 24);
  const insetH = 145;
  const ix = clamp(x + w * 0.52, 12, canvas.width - insetW - 12);
  const iy = clamp(y + h * 0.55, 42, canvas.height - insetH - 12);
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.strokeStyle = "#a5f3fc";
  ctx.lineWidth = 2;
  roundRect(ix, iy, insetW, insetH, 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a5f3fc";
  ctx.font = "800 13px Poppins, sans-serif";
  ctx.fillText("microscopic layer", ix + 16, iy + 24);
  ctx.fillStyle = "#fff";
  ctx.font = "700 13px Poppins, sans-serif";
  wrapText(concept.micro, ix + 16, iy + 48, insetW - 32, 17, 2);
  for (let i = 0; i < 18; i += 1) {
    const angle = phase * (0.8 + i * 0.03) + i;
    const px = ix + insetW * 0.5 + Math.cos(angle) * (30 + (i % 4) * 12);
    const py = iy + 102 + Math.sin(angle * 1.2) * (14 + (i % 3) * 6);
    ctx.beginPath();
    ctx.fillStyle = i % 3 === 0 ? "#facc15" : i % 3 === 1 ? "#38bdf8" : "#14b8a6";
    ctx.arc(px, py, 4 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function updatePanel(prediction, speed) {
  const concept = conceptFor(prediction.label);
  recordScan(prediction.label);
  activeObject.textContent = `${prediction.label}: ${concept.title}`;
  activeSummary.textContent = concept.summary;
  confidenceReadout.textContent = selectedLabel() === "real object" ? `Auto guess (${Math.round(prediction.score * 100)}%)` : "Manual category";
  motionReadout.textContent = speed > 45 ? `${Math.round(speed)} px/sec in frame` : "Nearly still";
  forceReadout.textContent = concept.forces.join(", ");
  microReadout.textContent = concept.micro;
  conceptNotes.innerHTML = concept.notes.map((note) => `<li>${note}</li>`).join("");
  formulaStrip.innerHTML = concept.formulas.map((formula) => `<span>${formula}</span>`).join("");
  renderConceptChips(concept);
  updateWhatIfLink(prediction.label);
}

function recordScan(label) {
  if (!label || label === "real object") return;
  earnedObjects.add(label);
  localStorage.setItem("dls-scanned-objects", JSON.stringify([...earnedObjects]));
  const xp = earnedObjects.size * 25;
  scanScore.textContent = `${xp} XP • ${earnedObjects.size} discoveries`;
}

function renderConceptChips(concept) {
  const chips = [...new Set([
    ...concept.forces,
    concept.energy.includes("heat") ? "heat transfer" : "",
    concept.energy.includes("electric") ? "electricity" : "",
    "materials",
    "microscopic"
  ].filter(Boolean))].slice(0, 7);
  conceptChips.innerHTML = chips.map((chip, index) => (
    `<button type="button" class="${index === 0 ? "active" : ""}" data-concept="${chip}">${chip}</button>`
  )).join("");
  explainConcept(chips[0] || "materials");
}

function explainConcept(conceptName) {
  conceptExplainTitle.textContent = conceptName.replace(/\b\w/g, (letter) => letter.toUpperCase());
  conceptExplainCopy.textContent = conceptExplainers[conceptName] ||
    `${conceptName} is one of the science ideas connected to this object. Look at the overlay to see where it appears in real life.`;
}

function updateWhatIfLink(label) {
  const prompt = label === "sports ball" ? "What if gravity was Moon gravity for a basketball?" :
    label === "fan" ? "What if air resistance disappeared around a fan?" :
      label === "car" || label === "bicycle" ? "What if friction became zero on roads?" :
        label === "potted plant" ? "What if sunlight disappeared for plants?" :
          "What if gravity changed for this object?";
  whatIfLink.href = `simulator.html?prompt=${encodeURIComponent(prompt)}`;
}

function centerOf(prediction) {
  const [x, y, w, h] = prediction.bbox;
  return { x: x + w / 2, y: y + h / 2 };
}

function wrapText(text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

scienceToolbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-layer]");
  if (!button) return;
  const layer = button.dataset.layer;
  if (activeLayers.has(layer)) activeLayers.delete(layer);
  else activeLayers.add(layer);
  button.classList.toggle("active", activeLayers.has(layer));
  drawFrame();
});

conceptChips?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-concept]");
  if (!button) return;
  conceptChips.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  explainConcept(button.dataset.concept);
});

objectTypeSelect?.addEventListener("change", () => {
  trackedPrediction = null;
  tfPrediction = null;
  lastCenter = null;
  drawFrame();
});
startButtons.forEach((button) => button?.addEventListener("click", startCamera));
flipCameraButton?.addEventListener("click", flipCamera);

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files?.[0];
  if (!file) return;
  stopCamera();
  trackedPrediction = null;
  tfPrediction = null;
  lastCenter = null;
  sourceMode = "upload";
  video.pause();
  video.style.display = "none";
  uploadedFrame.style.display = "block";
  uploadedFrame.onload = () => {
    statusText.textContent = "Image scanned. Diagrams are active.";
    drawFrame();
  };
  uploadedFrame.src = URL.createObjectURL(file);
});

setCanvasSize();
drawFrame();
statusText.textContent = "Scanner ready. Diagrams are active.";
loadTensorFlowModels();
