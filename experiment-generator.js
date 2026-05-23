const $ = (selector) => document.querySelector(selector);

const form = $("#experimentForm");
const promptInput = $("#experimentPrompt");
const examples = $(".example-prompts");
const loading = $("#generatorLoading");
const shell = $("#generatedShell");
const copyButton = $("#copyModule");
const printButton = $("#printModule");
const regenerateButton = $("#regenerateModule");
const pdfButton = $("#downloadPdf");
const analyzeButton = $("#analyzeData");
const clearDataButton = $("#clearData");
const dataFeedback = $("#dataFeedback");
const moduleResult = $("#moduleResult");
const moduleVisual = $("#moduleVisual");
const modulePhoto = $("#modulePhoto");
const modulePhotoCaption = $("#modulePhotoCaption");

let currentModule = null;
let lastPrompt = "Why do sneakers grip the floor?";

const unsafeWords = [
  "fire", "flame", "burn", "explosion", "explode", "gunpowder", "bleach",
  "ammonia", "acid", "electric outlet", "wall electricity", "knife", "razor",
  "toxic", "poison", "dry ice", "boiling oil", "firework", "battery acid",
];

const stopWords = new Set("why how does do can will what when where the a an is are to in on with from my your for of and or it things stuff science".split(" "));

const profiles = [
  ["shoe sneaker skid slide floor grip friction", "Sneaker Grip Question", "motion", "Friction is a force that resists sliding. Different surfaces create different amounts of grip.", "Every time you run, stop, or turn, your shoes push against the floor. The amount of grip helps decide whether you stop safely or slide.", "Which household surface gives a sneaker or toy shoe the most grip?", ["Sneaker or rubber-soled shoe", "Book to use as a ramp", "Cardboard", "Towel", "Wax paper", "Ruler", "Tape", "Notebook"], "Surface", "Slide distance", ["Wax paper", "Cardboard", "Towel"], "The grippier surface should make the shoe slide a shorter distance. Smoother surfaces usually let it travel farther.", "Rougher or softer surfaces create more friction with the shoe sole. More friction changes motion by turning some movement energy into heat and tiny surface vibrations.", "Try the same test with a different shoe sole pattern and compare which tread design grips best.", "down"],
  ["plant leaf seed flower sunlight photosynthesis", "Plant Bending Question", "plant", "Plants respond to light. Many stems bend toward light because light helps plants make food through photosynthesis.", "Houseplants near windows often lean toward the sun. That daily-life movement is a science response called phototropism.", "How does changing the direction of light affect the way a plant grows?", ["Small safe houseplant or sprouted bean", "Cardboard box", "Adult help for cutting one opening", "Tape", "Ruler", "Notebook", "Window light"], "Light direction", "Stem lean", ["Open light", "Side window", "Top opening"], "The plant should slowly lean toward the brightest opening over several days.", "Plant cells on the shaded side can grow slightly longer, causing the stem to bend toward light. This helps the plant capture more energy.", "Test whether a mirror or white paper reflector changes how strongly the plant bends."],
  ["ball basketball bounce soccer tennis", "Bounce Energy Question", "motion", "A bouncing ball changes energy from gravitational potential energy to kinetic energy and back again.", "Sports depend on bounce. A basketball court, carpet, and grass can make the same ball behave very differently.", "Which surface makes a ball bounce the highest?", ["Small ball", "Ruler or measuring tape", "Hard floor", "Carpet", "Folded towel", "Notebook", "Helper"], "Surface", "Bounce height", ["Hard floor", "Carpet", "Folded towel"], "The ball should bounce highest on the hardest surface and lowest on the softest surface.", "Soft surfaces absorb more energy by squishing, warming slightly, and moving fibers. Less returned energy means a lower bounce.", "Change the drop height and see whether the same surface still wins."],
  ["cloud weather rain cycle humidity fog condensation", "Cloud Formation Question", "water", "Clouds form when water vapor cools and condenses into tiny droplets.", "Clouds, foggy mirrors, and water drops on a cold cup all show condensation in everyday life.", "How does a cold surface help water vapor turn into visible droplets?", ["Clear cup", "Warm tap water", "Ice cubes in a sealed bag", "Dark paper", "Notebook", "Adult helper"], "Cooling", "Droplet amount", ["No ice", "Some ice", "More ice"], "More cooling should create more visible droplets near the top of the cup.", "Warm water adds water vapor to the air. When that vapor touches a colder area, the particles slow down and gather as liquid droplets.", "Compare a metal spoon and a plastic spoon above warm water to see which collects droplets faster."],
  ["sound music speaker voice vibration guitar", "Sound Vibration Question", "sound", "Sound is caused by vibrations traveling through matter such as air, string, or a cup.", "Speakers, voices, instruments, and phones all work because vibrations move energy to your ears.", "How does changing tension affect the sound made by a rubber band?", ["Rubber bands", "Empty tissue box or plastic container", "Ruler", "Notebook", "Tape"], "Rubber band tension", "Pitch description", ["Loose", "Medium", "Tight"], "A tighter rubber band should make a higher-pitched sound than a loose rubber band.", "Tighter rubber bands vibrate faster. Faster vibrations create higher pitch, while slower vibrations create lower pitch.", "Try rubber bands with different thicknesses and compare their pitch."],
  ["magnet magnetic compass metal", "Magnet Pull Question", "magnet", "Magnets create invisible magnetic fields that can pull on some metals from a distance.", "Magnets hold notes on refrigerators, help speakers work, and guide compasses.", "How does distance change the strength of a magnet's pull?", ["Refrigerator magnet", "Paper clips", "Ruler", "Paper", "Notebook"], "Distance", "Paper clips moved", ["0 cm", "1 cm", "2 cm"], "The magnet should move or lift more paper clips when it is closer.", "Magnetic force gets weaker with distance. Close objects experience a stronger pull from the magnetic field.", "Place paper, cardboard, or cloth between the magnet and clips to test whether the field still reaches through."],
  ["oil density float sink buoyancy heavy ship", "Floating and Sinking Question", "water", "Density compares how much matter is packed into a certain space. Less dense materials float on more dense materials.", "Oil floating on water, ice in a drink, and boats on lakes all connect to density and buoyancy.", "Which safe household items float or sink in water, and what pattern do they show?", ["Clear bowl of water", "Spoon", "Small plastic cap", "Cork or pencil piece", "Coin", "Aluminum foil", "Towel", "Notebook"], "Object", "Float or sink result", ["Plastic cap", "Coin", "Foil boat"], "Objects with lower overall density should float. Objects with higher density should sink unless their shape spreads out the weight.", "Water pushes upward on objects. If the upward buoyant force can balance the object's weight, the object floats.", "Shape a piece of foil into different boats and test which shape holds the most coins before sinking."],
  ["hot cold temperature heat insulation spoon melt", "Heat Transfer Question", "heat", "Heat moves from warmer objects to cooler objects by conduction, convection, or radiation.", "Hot spoons, cold drinks, jackets, and melting ice all show heat moving through daily life.", "Which material slows heat transfer the most?", ["Three cups", "Warm tap water", "Foil", "Paper towel", "Cloth", "Thermometer if available", "Timer", "Notebook"], "Wrapping material", "Temperature change", ["No wrap", "Paper towel", "Cloth"], "The best insulator should keep the water warm longer and show the smallest temperature drop.", "Insulators trap air or slow particle collisions, reducing how quickly thermal energy leaves the cup.", "Try the same test with cold water and see which material keeps it cold longest.", "down"],
  ["shadow rainbow mirror reflection sun", "Light and Shadow Question", "light", "Light travels in straight lines until it reflects, bends, or gets blocked.", "Shadows, mirrors, rainbows, and bright windows are everyday evidence of how light moves.", "How does changing distance from a light source affect shadow size?", ["Flashlight", "Small toy or cup", "Wall or paper screen", "Ruler", "Tape", "Notebook"], "Distance from light", "Shadow size", ["Close", "Middle", "Far"], "The object should make a larger shadow when it is closer to the flashlight.", "Light spreads out from the flashlight. A close object blocks a wider cone of light, so the shadow becomes larger.", "Try objects with different shapes and compare how clearly their shadows form."],
  ["dissolve sugar salt mix solution stir", "Dissolving Question", "water", "Dissolving happens when tiny particles spread evenly through a liquid.", "Sugar in tea, salt in soup, and drink mixes all use dissolving.", "How does stirring affect how fast a safe solid dissolves in water?", ["Two clear cups", "Water", "Sugar or salt", "Spoon", "Timer", "Notebook"], "Stirring", "Time to dissolve", ["No stirring", "Slow stirring", "Fast stirring"], "The stirred cup should dissolve the solid faster than the cup left alone.", "Stirring moves fresh water around the solid more often, helping particles separate and spread out faster.", "Test whether warm tap water changes the dissolving time compared with room-temperature water."],
  ["static electricity balloon hair charge cling", "Static Electricity Question", "light", "Static electricity happens when electric charges build up on a surface. Opposite charges can attract each other without touching.", "A balloon sticking to hair, laundry clinging together, and tiny paper bits jumping upward are daily examples of static charge.", "How does rubbing time affect how strongly a balloon attracts small paper pieces?", ["Balloon", "Small paper bits", "Wool sweater or clean cloth", "Timer", "Ruler", "Notebook"], "Rubbing time", "Paper pieces attracted", ["5 seconds", "15 seconds", "30 seconds"], "Longer rubbing should usually attract more paper pieces because more charge can build up on the balloon.", "Rubbing transfers tiny charged particles between materials. When the charged balloon gets close to neutral paper, charges in the paper shift slightly, creating attraction.", "Try different cloth materials and compare which one builds the strongest static charge."],
  ["rust tarnish oxidation apple browning brown metal", "Oxidation Question", "heat", "Oxidation happens when a material reacts with oxygen. Some oxidation changes color, texture, or strength over time.", "Apples browning, pennies dulling, and some metals rusting are everyday signs that matter can react with oxygen.", "How does covering a cut apple change how quickly it browns?", ["Apple slices prepared by an adult", "Lemon juice", "Water", "Three small plates", "Timer", "Notebook"], "Covering liquid", "Browning amount", ["No liquid", "Water", "Lemon juice"], "The lemon juice slice should brown more slowly than the uncovered slice.", "Lemon juice is acidic and slows the reaction between apple chemicals and oxygen. Water can block some oxygen, but it usually does not slow browning as much.", "Test whether covering the slices with plastic wrap changes the browning rate."],
  ["air pressure straw balloon squeeze push suction", "Air Pressure Question", "motion", "Air pressure is the push of air particles hitting surfaces. Pressure differences can move objects or liquids.", "Straws, balloons, suction cups, and sealed containers all show that invisible air can push and pull.", "How does changing air space affect how far a paper ball moves?", ["Balloon", "Paper ball", "Tape line", "Ruler", "Notebook", "Clear floor or table"], "Balloon inflation size", "Paper ball distance", ["Small", "Medium", "Large"], "A larger inflated balloon should push more air and move the paper ball farther.", "More trapped air stores more energy. When released, moving air transfers energy to the paper ball and pushes it forward.", "Try changing the paper ball size and compare how mass affects motion."],
].map(([keys, title, visual, concept, connection, question, materials, variable, measurement, values, happened, why, extension, trend = "up"]) => ({
  keys: keys.split(" "), title, visual, concept, connection, question, materials, variable, measurement, values, happened, why, extension, trend,
}));

const genericCategories = [
  ["move roll car bike speed ramp motion force", "motion", "Forces can change an object's speed, direction, or shape.", "Ramp height", "Travel distance", ["Low ramp", "Medium ramp", "High ramp"], ["Small toy car or rolling object", "Books", "Cardboard ramp", "Ruler", "Tape", "Notebook"]],
  ["water wet absorb paper towel cloth leak bottle", "water", "Water can move into tiny spaces in materials. Materials with more connected spaces often absorb more water.", "Material", "Water absorbed", ["Paper towel", "Cloth", "Notebook paper"], ["Small water cup", "Paper towel", "Cloth", "Notebook paper", "Measuring spoon", "Plate", "Notebook"]],
  ["color dark sun warm cool", "heat", "Different colors can absorb and reflect different amounts of light energy.", "Paper color", "Temperature or warmth", ["White paper", "Black paper", "Colored paper"], ["White paper", "Black paper", "Colored paper", "Sunny window", "Thermometer if available", "Notebook"]],
].map(([keys, visual, concept, variable, measurement, values, materials]) => ({
  keys: keys.split(" "), visual, concept, variable, measurement, values, materials, trend: "up",
}));

function cleanPrompt(value) {
  return value.trim().replace(/\s+/g, " ");
}

function titleCase(text) {
  return text.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function extractTopic(prompt) {
  const words = prompt.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
  return words.slice(0, 3).join(" ") || "everyday object";
}

function isUnsafe(prompt) {
  const lower = prompt.toLowerCase();
  return unsafeWords.some((word) => lower.includes(word));
}

function keywordMatches(text, key) {
  if (key.includes(" ")) return text.includes(key);
  return new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text);
}

function findProfile(prompt) {
  const lower = prompt.toLowerCase();
  let best = null;
  let bestScore = 0;

  profiles.forEach((profile) => {
    const score = profile.keys.reduce((total, key) => total + (keywordMatches(lower, key) ? 1 : 0), 0);
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  });

  return best;
}

function genericProfile(prompt) {
  const lower = prompt.toLowerCase();
  const topic = extractTopic(prompt);
  let category = null;
  let bestScore = 0;

  genericCategories.forEach((item) => {
    const score = item.keys.reduce((total, key) => total + (keywordMatches(lower, key) ? 1 : 0), 0);
    if (score > bestScore) {
      category = item;
      bestScore = score;
    }
  });

  category = category || {
    visual: "general",
    concept: "Scientists can investigate everyday objects by changing one variable, measuring the result, and looking for a pattern.",
    variable: "Test condition",
    measurement: "Measured result",
    values: ["Original setup", "Small change", "Bigger change"],
    materials: ["Object related to your question", "Paper", "Pencil", "Ruler", "Timer", "Tape", "Notebook"],
  };
  return {
    title: `${titleCase(topic)} Question`,
    visual: category.visual,
    concept: category.concept,
    connection: `${titleCase(topic)} can become a Daily Life Science investigation when you connect it to something you can safely change and measure at home.`,
    question: `How does changing the ${category.variable.toLowerCase()} affect the ${category.measurement.toLowerCase()} for ${topic}?`,
    materials: category.materials,
    variable: category.variable,
    measurement: category.measurement,
    values: category.values,
    happened: `The result should change when the ${category.variable.toLowerCase()} changes. The strongest pattern in the data tells you which condition had the biggest effect.`,
    why: `${category.concept} In this experiment, the data helps show whether the changed variable caused a real difference or just a small random change.`,
    extension: `Try the same investigation with a second ${topic} example and compare whether the pattern stays the same.`,
    trend: category.trend || "up",
  };
}

function chooseVisual(prompt, visual) {
  const lower = prompt.toLowerCase();
  const visualRules = [
    ["plant", ["plant", "leaf", "seed", "flower", "photosynthesis"]],
    ["water", ["water", "cloud", "rain", "absorb", "dissolve", "float", "sink", "density", "wet"]],
    ["heat", ["heat", "hot", "cold", "temperature", "melt", "insulation", "rust", "oxidation", "brown"]],
    ["light", ["light", "shadow", "rainbow", "mirror", "static", "electric", "charge"]],
    ["sound", ["sound", "music", "vibration", "speaker", "voice"]],
    ["magnet", ["magnet", "magnetic", "compass"]],
    ["motion", ["motion", "force", "speed", "bounce", "roll", "air pressure", "balloon", "sneaker", "friction"]],
  ];

  let selected = visual;
  let bestScore = 0;
  visualRules.forEach(([candidate, words]) => {
    const score = words.reduce((total, word) => total + (keywordMatches(lower, word) ? 1 : 0), 0);
    if (score > bestScore) {
      selected = candidate;
      bestScore = score;
    }
  });
  return selected || "general";
}

function imageQueryFor(module, prompt) {
  const lower = prompt.toLowerCase();
  const topic = extractTopic(prompt);
  const rules = [
    ["sneaker grip rubber sole floor friction", ["sneaker", "shoe", "grip", "friction"]],
    ["plant growing sunlight window leaves", ["plant", "leaf", "seed", "photosynthesis"]],
    ["basketball bouncing on court", ["ball", "basketball", "bounce"]],
    ["cloud condensation weather sky", ["cloud", "weather", "rain", "condensation"]],
    ["rubber bands sound vibration instrument", ["sound", "music", "rubber band", "vibration"]],
    ["magnet paper clips science", ["magnet", "magnetic", "paper clips"]],
    ["water density floating objects", ["density", "float", "sink", "buoyancy"]],
    ["heat transfer cup insulation", ["heat", "hot", "cold", "temperature", "insulation"]],
    ["flashlight shadow experiment", ["shadow", "light", "mirror", "reflection"]],
    ["sugar dissolving in water", ["dissolve", "sugar", "salt", "solution"]],
    ["static electricity balloon hair", ["static", "electricity", "charge", "balloon"]],
    ["apple browning oxidation", ["oxidation", "apple", "browning", "rust"]],
    ["balloon air pressure experiment", ["air pressure", "straw", "suction", "balloon"]],
    ["paper towel absorbing water", ["absorb", "paper towel", "cloth", "wet"]],
  ];
  const match = rules.find(([, words]) => words.some((word) => keywordMatches(lower, word)));
  return match ? match[0] : `${topic} science experiment household`;
}

function seededImageUrl(query) {
  const seed = encodeURIComponent(query.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  return `https://picsum.photos/seed/dls-${seed}/1200/720`;
}

function safeProfile() {
  return {
    title: "Safe Alternative Science Question",
    visual: "safe",
    concept: "Safe experiments test cause and effect without dangerous heat, chemicals, electricity, sharp tools, explosions, or toxic materials.",
    connection: "Some science questions are interesting but not safe for an at-home public activity. This module keeps the investigation safe while still testing cause and effect.",
    question: "How can changing one safe household variable affect an observable result?",
    materials: ["Paper", "Pencil", "Ruler", "Timer", "Cup of water", "Household object", "Notebook"],
    variable: "Safe test condition",
    measurement: "Observation",
    values: ["Condition 1", "Condition 2", "Condition 3"],
    happened: "One safe condition should create a different result than the others. That difference is the evidence.",
    why: "Changing one variable changes the conditions of the system. Careful observations let you connect the cause to the effect.",
    extension: "Create a safer model of the original idea using water, paper, light, motion, or temperature instead of risky materials.",
    trend: "any",
  };
}

function buildModule(prompt) {
  const safePrompt = cleanPrompt(prompt) || lastPrompt;
  const base = isUnsafe(safePrompt) ? safeProfile() : findProfile(safePrompt) || genericProfile(safePrompt);
  const visual = chooseVisual(safePrompt, base.visual);
  const fairTestNote = `This is a fair test because only the ${base.variable.toLowerCase()} changes. The materials, timing, and measuring method stay the same, so the data can point back to one cause.`;
  return {
    ...base,
    visual,
    subtitle: isUnsafe(safePrompt)
      ? "This request was converted into a safer Daily Life Science experiment."
      : `Inspired by your question: ${safePrompt}`,
    realLife: base.connection,
    imageQuery: imageQueryFor(base, safePrompt),
    concept: `${base.concept} In this module, you will test that idea by changing one variable and collecting evidence instead of just guessing.`,
    hypothesis: `If the ${base.variable.toLowerCase()} changes, then the ${base.measurement.toLowerCase()} will change because the particles, forces, energy transfer, or material interactions in the system are different.`,
    procedure: [
      "Set up a clear workspace and place your notebook nearby.",
      `Prepare three tests: ${base.values.join(", ")}.`,
      `Change only the ${base.variable.toLowerCase()}. Keep the other materials, starting position, timing, and measuring method the same.`,
      "Before testing, write one prediction for which condition will create the biggest result.",
      `Run the first test and record the ${base.measurement.toLowerCase()}.`,
      "Repeat the first condition two more times so the result is more reliable.",
      "Run the other two test conditions the same way.",
      "Calculate or estimate the average for each condition.",
      "Compare the averages and write one claim that uses evidence from the data table.",
    ],
    table: {
      heads: [base.variable, "Trial 1", "Trial 2", "Trial 3", `Average ${base.measurement}`],
      rows: base.values.map((value) => [value, "", "", "", ""]),
    },
    trend: base.trend || "up",
    happened: `${base.happened} Look for whether all three trials point in the same direction. If one trial is very different, repeat it because measurement mistakes and small setup changes can affect results.`,
    why: `${base.why} ${fairTestNote} When the pattern repeats across trials, the evidence is stronger because the result is less likely to be a random accident.`,
    reflection: [
      `Which ${base.variable.toLowerCase()} caused the biggest change?`,
      "What did you keep the same to make this a fair test?",
      "What evidence from your data supports your conclusion?",
      "Where might this same science show up in daily life?",
    ],
    quiz: [
      `What was the independent variable? Answer: ${base.variable}.`,
      `What was the dependent variable? Answer: ${base.measurement}.`,
      "Why repeat trials? Answer: repeated trials make results more reliable.",
      "What makes this experiment safer for home use? Answer: it uses household materials and avoids dangerous heat, chemicals, wall electricity, sharp tools, and toxic substances.",
    ],
    safety: [
      "Use household materials only.",
      "Do not use fire, dangerous chemicals, sharp tools, wall electricity, explosions, or anything toxic.",
      "Clean spills right away and ask an adult before changing materials.",
    ],
  };
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function setList(id, items) {
  $(`#${id}`).innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderModule(module) {
  currentModule = module;
  moduleResult.dataset.visual = module.visual;
  moduleVisual.dataset.visual = module.visual;
  moduleVisual.classList.remove("photo-failed");
  modulePhoto.src = seededImageUrl(module.imageQuery);
  modulePhoto.alt = `${module.imageQuery} photo for ${module.title}`;
  modulePhotoCaption.textContent = `Online image: ${module.imageQuery}`;

  $("#moduleTitle").textContent = module.title;
  $("#moduleSubtitle").textContent = module.subtitle;
  $("#realLifeConnection").textContent = module.realLife;
  $("#scienceConcept").textContent = module.concept;
  $("#experimentQuestion").textContent = module.question;
  $("#hypothesisText").textContent = module.hypothesis;
  $("#whatHappened").textContent = module.happened;
  $("#whyHappened").textContent = module.why;
  $("#extensionChallenge").textContent = module.extension;

  setList("materialsList", module.materials);
  setList("procedureList", module.procedure);
  setList("reflectionList", module.reflection);
  setList("quizList", module.quiz);
  setList("safetyList", module.safety);

  $("#dataHead").innerHTML = `<tr>${module.table.heads.map((head) => `<th>${escapeHtml(head)}</th>`).join("")}</tr>`;
  $("#dataBody").innerHTML = module.table.rows
    .map((row, rowIndex) => `<tr>${row.map((cell, cellIndex) => {
      if (cellIndex === 0) return `<th scope="row">${escapeHtml(cell)}</th>`;
      const label = module.table.heads[cellIndex];
      return `<td><input class="data-input" inputmode="decimal" aria-label="${escapeHtml(row[0])} ${escapeHtml(label)}" data-row="${rowIndex}" data-col="${cellIndex}" type="text" /></td>`;
    }).join("")}</tr>`)
    .join("");
  dataFeedback.textContent = "Enter your trial results, then analyze the trend.";
  dataFeedback.className = "data-feedback";
}

function numericValue(value) {
  const match = String(value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getDataRows() {
  return currentModule.table.rows.map((row, rowIndex) => {
    const trialInputs = [...document.querySelectorAll(`.data-input[data-row="${rowIndex}"]`)].slice(0, 3);
    const trials = trialInputs.map((input) => numericValue(input.value)).filter((value) => Number.isFinite(value));
    const manualAverage = numericValue(document.querySelector(`.data-input[data-row="${rowIndex}"][data-col="4"]`)?.value || "");
    const calculatedAverage = trials.length ? trials.reduce((sum, value) => sum + value, 0) / trials.length : null;
    return {
      label: row[0],
      trials,
      average: Number.isFinite(manualAverage) ? manualAverage : calculatedAverage,
    };
  });
}

function analyzeData() {
  if (!currentModule) return;
  const rows = getDataRows();
  const completeRows = rows.filter((row) => Number.isFinite(row.average));

  if (completeRows.length < 2) {
    dataFeedback.className = "data-feedback needs-data";
    dataFeedback.textContent = "Add numbers for at least two conditions. Then I can compare the averages and look for a trend.";
    return;
  }

  const noisyRows = rows.filter((row) => {
    if (row.trials.length < 2) return false;
    const min = Math.min(...row.trials);
    const max = Math.max(...row.trials);
    const avg = row.trials.reduce((sum, value) => sum + value, 0) / row.trials.length;
    return avg !== 0 && (max - min) / Math.abs(avg) > 0.45;
  });

  const averages = completeRows.map((row) => row.average);
  const increasing = averages.every((value, index) => index === 0 || value >= averages[index - 1]);
  const decreasing = averages.every((value, index) => index === 0 || value <= averages[index - 1]);
  const strongest = completeRows.reduce((best, row) => row.average > best.average ? row : best, completeRows[0]);
  const weakest = completeRows.reduce((best, row) => row.average < best.average ? row : best, completeRows[0]);
  const expected = currentModule.trend;
  const matches = expected === "any" || (expected === "up" && increasing) || (expected === "down" && decreasing);

  dataFeedback.className = `data-feedback ${matches ? "supports" : "check"}`;
  const trendText = increasing ? "increases" : decreasing ? "decreases" : "does not move in one clear direction";
  const caution = noisyRows.length
    ? ` One condition has trials that are far apart (${noisyRows.map((row) => row.label).join(", ")}), so repeating that test would make the evidence stronger.`
    : "";
  dataFeedback.textContent = matches
    ? `Your data supports the expected pattern: the average ${trendText}. Strongest result: ${strongest.label}. Smallest result: ${weakest.label}.${caution}`
    : `Your data shows a pattern, but it may not match the expected trend for this setup. The average ${trendText}. Check whether the same measuring method and timing were used each time.${caution}`;
}

function clearData() {
  document.querySelectorAll(".data-input").forEach((input) => {
    input.value = "";
  });
  dataFeedback.className = "data-feedback";
  dataFeedback.textContent = "Enter your trial results, then analyze the trend.";
}

function generate(prompt) {
  lastPrompt = cleanPrompt(prompt) || lastPrompt;
  shell.classList.remove("visible");
  loading.classList.add("visible");
  window.setTimeout(() => {
    renderModule(buildModule(lastPrompt));
    loading.classList.remove("visible");
    shell.classList.add("visible");
    shell.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 500);
}

function moduleAsText() {
  if (!currentModule) return "";
  const table = [currentModule.table.heads.join(" | "), ...currentModule.table.rows.map((row) => row.join(" | "))].join("\n");
  return [
    currentModule.title,
    currentModule.subtitle,
    "",
    `Real-Life Connection: ${currentModule.realLife}`,
    `Science Concept: ${currentModule.concept}`,
    `Experiment Question: ${currentModule.question}`,
    `Materials:\n- ${currentModule.materials.join("\n- ")}`,
    `Hypothesis: ${currentModule.hypothesis}`,
    `Procedure:\n${currentModule.procedure.map((step, index) => `${index + 1}. ${step}`).join("\n")}`,
    `Data Table:\n${table}`,
    `What Happened? ${currentModule.happened}`,
    `Why It Happened: ${currentModule.why}`,
    `Reflection Questions:\n- ${currentModule.reflection.join("\n- ")}`,
    `Quick Quiz:\n${currentModule.quiz.map((item, index) => `${index + 1}. ${item}`).join("\n")}`,
    `Safety Notes:\n- ${currentModule.safety.join("\n- ")}`,
    `Extension Challenge: ${currentModule.extension}`,
    "",
    "Want to save your experiments? Create a free DLS account.",
  ].join("\n\n");
}

function downloadTextPdf() {
  const lines = moduleAsText().split("\n").flatMap((line) => {
    if (line.length < 84) return [line];
    const chunks = [];
    for (let index = 0; index < line.length; index += 84) chunks.push(line.slice(index, index + 84));
    return chunks;
  });
  const escapedLines = lines.slice(0, 58).map((line) => line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"));
  const textStream = escapedLines.map((line, index) => `BT /F1 10 Tf 54 ${740 - index * 12} Td (${line}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${textStream.length} >> stream\n${textStream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n");
  pdf += `\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${currentModule.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  generate(promptInput.value);
});

examples?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-prompt]");
  if (!button) return;
  promptInput.value = button.dataset.prompt;
  generate(button.dataset.prompt);
});

copyButton?.addEventListener("click", async () => {
  await navigator.clipboard.writeText(moduleAsText());
  copyButton.textContent = "Copied";
  window.setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 1200);
});

printButton?.addEventListener("click", () => window.print());
regenerateButton?.addEventListener("click", () => generate(lastPrompt));
pdfButton?.addEventListener("click", downloadTextPdf);
analyzeButton?.addEventListener("click", analyzeData);
clearDataButton?.addEventListener("click", clearData);
modulePhoto?.addEventListener("error", () => {
  moduleVisual.classList.add("photo-failed");
  modulePhotoCaption.textContent = "Image could not load, showing generated science visual instead.";
});
modulePhoto?.addEventListener("load", () => {
  moduleVisual.classList.remove("photo-failed");
});

generate(lastPrompt);
