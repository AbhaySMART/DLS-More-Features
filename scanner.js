const video = document.querySelector("#cameraFeed");
const uploadedFrame = document.querySelector("#uploadedFrame");
const canvas = document.querySelector("#overlayCanvas");
const ctx = canvas.getContext("2d");
const startButtons = [document.querySelector("#startCamera"), document.querySelector("#startCameraNav")];
const uploadInput = document.querySelector("#imageUpload");
const statusText = document.querySelector("#scannerStatus");
const activeObject = document.querySelector("#activeObject");
const activeSummary = document.querySelector("#activeSummary");
const confidenceReadout = document.querySelector("#confidenceReadout");
const motionReadout = document.querySelector("#motionReadout");
const forceReadout = document.querySelector("#forceReadout");
const microReadout = document.querySelector("#microReadout");
const conceptNotes = document.querySelector("#conceptNotes");
const formulaStrip = document.querySelector("#formulaStrip");
const scienceToolbar = document.querySelector("#scienceToolbar");

const activeLayers = new Set(["forces", "energy", "motion", "materials", "micro"]);

const conceptLibrary = {
  person: {
    title: "Human body systems",
    summary: "DLS maps posture, balance, muscles, respiration, ground friction, and energy use onto the live body.",
    forces: ["weight through center of mass", "normal force from ground", "friction at shoes", "muscle force"],
    micro: "muscle fibers + oxygen delivery + ATP energy",
    material: "skin, bone, muscle, fabric, shoe rubber",
    energy: "chemical energy → muscle work → heat",
    formulas: ["F = m × a", "Power = work/time", "cellular respiration: glucose + O2 → ATP"],
    notes: [
      "Center-of-mass marker shows whether balance is stable.",
      "Ground contact highlights shoe friction and normal force.",
      "Energy layer links motion to muscle work and body heat."
    ]
  },
  bicycle: {
    title: "Simple machines + rotational motion",
    summary: "The wheel, axle, chain, tires, and gears convert push forces into rolling motion.",
    forces: ["torque at wheel hub", "rolling friction at tire", "normal force", "centripetal force"],
    micro: "rubber polymer grip + metal spoke tension",
    material: "rubber tire, aluminum/steel frame, lubricated chain",
    energy: "leg work → rotational kinetic energy → heat in tires",
    formulas: ["τ = r × F", "v = ωr", "friction = μN"],
    notes: [
      "Rotational arrows show angular velocity around the wheel.",
      "Tire contact patch shows friction pushing on the road.",
      "Spoke stress lines show how tension distributes load."
    ]
  },
  car: {
    title: "Transportation physics",
    summary: "The scanner identifies thrust, drag, tire friction, braking heat, and material structures.",
    forces: ["engine thrust", "air drag", "tire friction", "normal force", "gravity"],
    micro: "rubber tread + metal chassis + glass + combustion or battery chemistry",
    material: "steel/aluminum body, glass, rubber, plastic, battery/fuel",
    energy: "fuel/electricity → kinetic energy → heat + sound",
    formulas: ["drag ∝ v²", "friction = μN", "KE = 1/2mv²"],
    notes: [
      "Forward thrust vector appears along the vehicle's likely travel axis.",
      "Drag grows quickly with speed, so it is drawn opposite motion.",
      "Brake heat shows where kinetic energy turns into thermal energy."
    ]
  },
  sports: {
    title: "Projectile motion + spin",
    summary: "DLS overlays gravity, velocity, spin, air resistance, bounce loss, and elastic material behavior.",
    forces: ["gravity", "applied force", "drag", "friction", "Magnus effect from spin"],
    micro: "elastic polymer stores and returns energy",
    material: "rubber, leather/synthetic panels, compressed air",
    energy: "kinetic energy ↔ elastic potential energy + heat loss",
    formulas: ["KE = 1/2mv²", "projectile path: y = v₀t - 1/2gt²", "impulse = FΔt"],
    notes: [
      "Gravity vector stays vertical while velocity follows motion.",
      "Spin ring shows rotation that can curve the path.",
      "Energy meter drops after impact because some energy becomes heat and sound."
    ]
  },
  bottle: {
    title: "Pressure + materials science",
    summary: "Containers reveal pressure, surface tension, condensation, polymers or metal structure, and fluid energy.",
    forces: ["internal pressure", "gravity", "normal force", "surface tension"],
    micro: "polymer chains or aluminum crystal lattice",
    material: "plastic polymer or aluminum shell + liquid + dissolved gas",
    energy: "pressure energy + chemical potential + thermal energy",
    formulas: ["Pressure = F/A", "density = mass/volume", "gas release: CO2(aq) → CO2(g)"],
    notes: [
      "Outward pressure ticks show fluid or gas pushing on the container.",
      "Condensation layer connects surface temperature to humidity.",
      "Material layer explains strength, flexibility, and recyclability."
    ]
  },
  cup: {
    title: "Fluids + heat transfer",
    summary: "The scanner shows liquid level, buoyancy, surface tension, conduction, convection, and evaporation.",
    forces: ["gravity", "buoyancy", "container support", "surface tension"],
    micro: "water molecules, dissolved particles, vapor molecules",
    material: "ceramic/plastic/metal cup + liquid",
    energy: "thermal energy moves by conduction, convection, and evaporation",
    formulas: ["Q = mcΔT", "buoyancy = displaced fluid weight", "evaporation removes heat"],
    notes: [
      "Convection arrows circulate inside the liquid region.",
      "Surface tension marks the rim and droplets.",
      "Heat layer shows energy moving from hot liquid to cooler air."
    ]
  },
  book: {
    title: "Forces + material structure",
    summary: "Books show compression, friction between pages, cellulose fibers, ink chemistry, and light reflection.",
    forces: ["weight", "normal force", "friction between pages", "compression"],
    micro: "cellulose fibers + ink pigments",
    material: "paper fibers, glue binding, ink, cover coating",
    energy: "light reflection + sound/heat from page motion",
    formulas: ["friction = μN", "stress = F/A", "reflection depends on surface texture"],
    notes: [
      "Compression arrows show how weight travels through the stack.",
      "Friction explains why pages resist sliding.",
      "Microscope inset shows cellulose fiber structure."
    ]
  },
  default: {
    title: "Real-world physics scan",
    summary: "DLS estimates forces from object position, size, shape, and motion, then adds general science layers.",
    forces: ["gravity", "support force", "possible friction", "motion/drag if moving"],
    micro: "material structure depends on the object",
    material: "detected surface, likely solid material, possible coating",
    energy: "stored energy + motion energy + heat exchange",
    formulas: ["F = m × a", "KE = 1/2mv²", "Pressure = F/A"],
    notes: [
      "Bounding box attaches the science overlay to the object's real position.",
      "Center-of-mass and gravity are estimated from the object shape.",
      "Motion trails appear when the object moves between frames."
    ]
  }
};

const classAliases = {
  "sports ball": "sports",
  frisbee: "sports",
  skateboard: "bicycle",
  motorcycle: "bicycle",
  truck: "car",
  bus: "car",
  train: "car",
  "traffic light": "car",
  bottle: "bottle",
  "wine glass": "cup",
  cup: "cup",
  bowl: "cup",
  book: "book",
  laptop: "book",
  cell_phone: "book",
  keyboard: "book"
};

let model;
let running = false;
let previousCenters = new Map();
let trails = new Map();
let lastFrameTime = performance.now();
let animationPhase = 0;

async function loadModel() {
  try {
    if (!window.cocoSsd) throw new Error("Object model unavailable");
    model = await cocoSsd.load();
    statusText.textContent = "Model ready. Start camera or upload an image.";
  } catch (error) {
    statusText.textContent = "Model could not load. Camera view still works with general physics overlays.";
  }
}

function resizeCanvas(width, height) {
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    uploadedFrame.style.display = "none";
    video.style.display = "block";
    video.srcObject = stream;
    await video.play();
    resizeCanvas(video.videoWidth || 1280, video.videoHeight || 720);
    running = true;
    statusText.textContent = model ? "Scanning live camera..." : "Camera on. Waiting for model...";
    scanLoop();
  } catch (error) {
    statusText.textContent = "Camera permission is needed. On phones, open this page from localhost or HTTPS.";
  }
}

async function scanLoop() {
  if (!running) return;
  const predictions = model ? await model.detect(video) : [];
  renderAnalysis(predictions, video.videoWidth || canvas.width, video.videoHeight || canvas.height);
  requestAnimationFrame(scanLoop);
}

async function analyzeImage() {
  if (!uploadedFrame.complete || !uploadedFrame.naturalWidth) return;
  resizeCanvas(uploadedFrame.naturalWidth, uploadedFrame.naturalHeight);
  const predictions = model ? await model.detect(uploadedFrame) : [];
  renderAnalysis(predictions, uploadedFrame.naturalWidth, uploadedFrame.naturalHeight);
}

function conceptFor(label) {
  const key = classAliases[label] || label;
  return conceptLibrary[key] || conceptLibrary.default;
}

function centerOf(prediction) {
  const [x, y, width, height] = prediction.bbox;
  return { x: x + width / 2, y: y + height / 2 };
}

function objectId(prediction, index) {
  return `${prediction.class}-${index}`;
}

function renderAnalysis(predictions, sourceWidth, sourceHeight) {
  const now = performance.now();
  const seconds = Math.max((now - lastFrameTime) / 1000, 0.016);
  lastFrameTime = now;
  animationPhase += seconds;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawHudGrid(sourceWidth, sourceHeight);

  const nextCenters = new Map();
  const visible = predictions.filter((prediction) => prediction.score > 0.42).slice(0, 6);
  if (visible.length === 0) {
    drawScenePhysics(sourceWidth, sourceHeight);
    updatePanel(null, conceptLibrary.default, 0);
    return;
  }

  visible.forEach((prediction, index) => {
    const id = objectId(prediction, index);
    const concept = conceptFor(prediction.class);
    const [x, y, width, height] = prediction.bbox;
    const center = centerOf(prediction);
    const previous = previousCenters.get(id) || previousCenters.get(prediction.class);
    const velocity = previous ? {
      x: (center.x - previous.x) / seconds,
      y: (center.y - previous.y) / seconds,
      speed: Math.hypot(center.x - previous.x, center.y - previous.y) / seconds
    } : { x: 0, y: 0, speed: 0 };

    updateTrail(id, center);
    const primary = index === 0;
    drawObjectScience(prediction, concept, velocity, primary);
    nextCenters.set(id, center);
    nextCenters.set(prediction.class, center);
  });

  const primary = visible[0];
  const primaryConcept = conceptFor(primary.class);
  const primaryCenter = centerOf(primary);
  const previous = previousCenters.get(objectId(primary, 0)) || previousCenters.get(primary.class);
  const motion = previous ? Math.round(Math.hypot(primaryCenter.x - previous.x, primaryCenter.y - previous.y) / seconds) : 0;
  previousCenters = nextCenters;
  updatePanel(primary, primaryConcept, motion);
}

function drawObjectScience(prediction, concept, velocity, primary) {
  const [x, y, width, height] = prediction.bbox;
  const center = centerOf(prediction);
  const color = primary ? "#14b8a6" : "#facc15";
  const massProxy = Math.max(0.55, Math.min(2.2, Math.sqrt(width * height) / 180));
  const speedProxy = Math.min(1.7, velocity.speed / 320);

  drawFocusBox(x, y, width, height, color, primary);

  if (activeLayers.has("motion")) {
    drawTrail(objectId(prediction, primary ? 0 : 1), color);
    if (velocity.speed > 35) {
      const vectorScale = Math.min(0.34, 115 / Math.max(velocity.speed, 1));
      drawVector(center.x, center.y, center.x + velocity.x * vectorScale, center.y + velocity.y * vectorScale, "#38bdf8", "velocity", 1 + speedProxy);
      drawVector(center.x + width * 0.12, center.y - height * 0.1, center.x - velocity.x * vectorScale * 0.6, center.y - velocity.y * vectorScale * 0.6, "#a78bfa", "drag", 0.9 + speedProxy * 0.4);
    }
  }

  if (activeLayers.has("forces")) {
    const gravityLength = Math.min(height * 0.62, 120 * massProxy);
    const supportLength = Math.min(height * 0.46, 84 * massProxy);
    drawCenterOfMass(center.x, center.y, color);
    drawVector(center.x, center.y, center.x, center.y + gravityLength, "#f97316", "weight mg", massProxy);
    drawVector(center.x, y + height, center.x, y + height - supportLength, "#22c55e", "normal N", massProxy);
    drawVector(x + width * 0.22, y + height * 0.86, x + width * 0.5, y + height * 0.86, "#eab308", "friction", 0.9);
  }

  if (activeLayers.has("energy")) {
    drawEnergyField(x, y, width, height, speedProxy, concept.energy);
  }

  if (activeLayers.has("materials")) {
    drawLeaderCallout(x + width, y + height * 0.25, x + width + 46, y + height * 0.08, "material", concept.material, "#facc15");
    drawStressTicks(x, y, width, height, primary ? 8 : 4);
  }

  if (activeLayers.has("micro") && primary) {
    drawMicroInset(x, y, width, height, concept);
  }

  drawLeaderCallout(x, y, x - 26, y - 26, prediction.class, `${Math.round(prediction.score * 100)}% confidence`, color);
}

function drawHudGrid(width, height) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#67e8f9";
  ctx.lineWidth = 1;
  const grid = Math.max(48, Math.min(width, height) / 10);
  for (let x = 0; x <= width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFocusBox(x, y, width, height, color, primary) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = primary ? 5 : 3;
  ctx.shadowBlur = primary ? 18 : 8;
  ctx.shadowColor = color;
  const corner = Math.min(44, width * 0.24, height * 0.24);
  const segments = [
    [x, y + corner, x, y, x + corner, y],
    [x + width - corner, y, x + width, y, x + width, y + corner],
    [x + width, y + height - corner, x + width, y + height, x + width - corner, y + height],
    [x + corner, y + height, x, y + height, x, y + height - corner]
  ];
  segments.forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  });
  ctx.setLineDash([10, 12]);
  ctx.globalAlpha = 0.55;
  roundRect(x, y, width, height, 18);
  ctx.stroke();
  ctx.restore();
}

function drawVector(x1, y1, x2, y2, color, label, weight = 1) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 13 + weight * 5;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3 + weight * 2;
  ctx.shadowBlur = 14;
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

function drawPill(text, x, y, color = "#14b8a6") {
  ctx.save();
  ctx.font = "800 16px Poppins, sans-serif";
  const width = Math.min(ctx.measureText(text).width + 22, 260);
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(x, y - 27, width, 32, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x + 11, y - 6);
  ctx.restore();
}

function drawLeaderCallout(anchorX, anchorY, boxX, boxY, title, detail, color) {
  const text = `${title}: ${detail}`;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.lineTo(boxX, boxY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(anchorX, anchorY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "800 15px Poppins, sans-serif";
  const maxWidth = Math.min(360, Math.max(190, ctx.measureText(text).width + 22));
  const x = Math.max(8, Math.min(canvas.width - maxWidth - 8, boxX));
  const y = Math.max(38, Math.min(canvas.height - 48, boxY));
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.strokeStyle = color;
  roundRect(x, y - 30, maxWidth, 38, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.fillText(text.slice(0, 48), x + 11, y - 6);
  ctx.restore();
}

function drawCenterOfMass(x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 14 + Math.sin(animationPhase * 4) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y + 20);
  ctx.stroke();
  ctx.restore();
  drawPill("center of mass", x + 16, y - 18, color);
}

function drawEnergyField(x, y, width, height, speedProxy, label) {
  const gradient = ctx.createRadialGradient(x + width * 0.5, y + height * 0.5, 10, x + width * 0.5, y + height * 0.5, Math.max(width, height) * 0.65);
  gradient.addColorStop(0, `rgba(250, 204, 21, ${0.26 + speedProxy * 0.18})`);
  gradient.addColorStop(0.55, "rgba(20, 184, 166, 0.14)");
  gradient.addColorStop(1, "rgba(20, 184, 166, 0)");
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(x - width * 0.22, y - height * 0.22, width * 1.44, height * 1.44);
  ctx.restore();

  const bars = 6;
  for (let i = 0; i < bars; i += 1) {
    const bx = x + 12 + i * 14;
    const bh = 12 + (Math.sin(animationPhase * 3 + i) + 1) * 9 + speedProxy * 18;
    ctx.fillStyle = i < 3 ? "#facc15" : "#14b8a6";
    roundRect(bx, y + height + 18 - bh, 8, bh, 4);
    ctx.fill();
  }
  drawPill(label.split(" → ").slice(0, 2).join(" → "), x + 8, y + height + 30, "#facc15");
}

function drawStressTicks(x, y, width, height, count) {
  ctx.save();
  ctx.strokeStyle = "rgba(251, 113, 133, 0.9)";
  ctx.lineWidth = 3;
  for (let i = 0; i < count; i += 1) {
    const t = (i + 1) / (count + 1);
    const px = x + width * t;
    ctx.beginPath();
    ctx.moveTo(px - 8, y + height * 0.12);
    ctx.lineTo(px + 8, y + height * 0.22);
    ctx.moveTo(px + 8, y + height * 0.12);
    ctx.lineTo(px - 8, y + height * 0.22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMicroInset(x, y, width, height, concept) {
  const insetW = Math.min(260, Math.max(210, canvas.width * 0.22));
  const insetH = 150;
  const ix = Math.max(14, Math.min(canvas.width - insetW - 14, x + width - insetW * 0.6));
  const iy = Math.max(54, Math.min(canvas.height - insetH - 18, y + height * 0.58));
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
  ctx.strokeStyle = "#a5f3fc";
  ctx.lineWidth = 2;
  roundRect(ix, iy, insetW, insetH, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a5f3fc";
  ctx.font = "800 13px Poppins, sans-serif";
  ctx.fillText("microscopic layer", ix + 16, iy + 24);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 14px Poppins, sans-serif";
  wrapText(concept.micro, ix + 16, iy + 48, insetW - 32, 18, 2);

  for (let i = 0; i < 16; i += 1) {
    const angle = animationPhase * (0.8 + i * 0.03) + i;
    const px = ix + insetW * 0.5 + Math.cos(angle) * (32 + (i % 4) * 12);
    const py = iy + 104 + Math.sin(angle * 1.2) * (16 + (i % 3) * 7);
    ctx.beginPath();
    ctx.fillStyle = i % 3 === 0 ? "#facc15" : i % 3 === 1 ? "#38bdf8" : "#14b8a6";
    ctx.arc(px, py, 4 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function updateTrail(id, center) {
  const current = trails.get(id) || [];
  current.push({ x: center.x, y: center.y, age: 1 });
  trails.set(id, current.slice(-18));
}

function drawTrail(id, color) {
  const trail = trails.get(id);
  if (!trail || trail.length < 2) return;
  ctx.save();
  for (let i = 1; i < trail.length; i += 1) {
    const a = trail[i - 1];
    const b = trail[i];
    const alpha = i / trail.length;
    ctx.strokeStyle = hexToRgba(color, alpha * 0.65);
    ctx.lineWidth = 2 + alpha * 5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScenePhysics(width, height) {
  drawPill("Scanning for recognizable objects", 24, 54, "#14b8a6");
  drawVector(width * 0.5, height * 0.28, width * 0.5, height * 0.52, "#f97316", "gravity field", 1.2);
  drawVector(width * 0.18, height * 0.72, width * 0.42, height * 0.72, "#38bdf8", "possible motion", 1);
  drawLeaderCallout(width * 0.5, height * 0.82, width * 0.52, height * 0.74, "surface", "support/friction plane", "#22c55e");
}

function updatePanel(prediction, concept, motion) {
  if (!prediction) {
    activeObject.textContent = "Scanning scene";
    activeSummary.textContent = "No high-confidence object yet. DLS is showing general field forces while it searches.";
    confidenceReadout.textContent = "--";
    motionReadout.textContent = "Tracking";
    forceReadout.textContent = conceptLibrary.default.forces.join(", ");
    microReadout.textContent = conceptLibrary.default.micro;
    conceptNotes.innerHTML = conceptLibrary.default.notes.map((note) => `<li>${note}</li>`).join("");
    formulaStrip.innerHTML = conceptLibrary.default.formulas.map((formula) => `<span>${formula}</span>`).join("");
    return;
  }

  activeObject.textContent = `${prediction.class}: ${concept.title}`;
  activeSummary.textContent = concept.summary;
  confidenceReadout.textContent = `${Math.round(prediction.score * 100)}%`;
  motionReadout.textContent = motion > 45 ? `${motion}px/sec in frame` : "Nearly still";
  forceReadout.textContent = concept.forces.join(", ");
  microReadout.textContent = concept.micro;
  conceptNotes.innerHTML = concept.notes.map((note) => `<li>${note}</li>`).join("");
  formulaStrip.innerHTML = concept.formulas.map((formula) => `<span>${formula}</span>`).join("");
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

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

scienceToolbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-layer]");
  if (!button) return;
  const layer = button.dataset.layer;
  if (activeLayers.has(layer)) activeLayers.delete(layer);
  else activeLayers.add(layer);
  button.classList.toggle("active", activeLayers.has(layer));
});

startButtons.forEach((button) => button?.addEventListener("click", startCamera));

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files?.[0];
  if (!file) return;
  running = false;
  video.pause();
  video.style.display = "none";
  uploadedFrame.src = URL.createObjectURL(file);
  uploadedFrame.style.display = "block";
  uploadedFrame.onload = analyzeImage;
  statusText.textContent = "Analyzing uploaded image...";
});

loadModel();
