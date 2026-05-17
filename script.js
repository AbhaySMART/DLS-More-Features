const scannerData = {
  basketball: {
    lock: "Basketball detected",
    image:
      "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=900&q=80",
    alt: "Basketball on a court",
    title: "Kinetic Energy + Projectile Motion",
    microTitle: "Rubber + air pressure",
    microText: "Elastic material stores and returns energy on each bounce.",
    items: [
      "Force arrows show the push from the hand and gravity pulling down.",
      "Spin vectors reveal backspin and sideways rotation.",
      "Energy loss appears when bounce height gets smaller."
    ]
  },
  microwave: {
    lock: "Microwave detected",
    image:
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=80",
    alt: "Microwave oven in a kitchen",
    title: "Electromagnetic Waves + Heat Transfer",
    microTitle: "Water molecules rotate",
    microText: "Microwaves make polar molecules wiggle, turning motion into heat.",
    items: [
      "Wave bands show electromagnetic radiation entering the food.",
      "Molecular animation shows water molecules rotating faster.",
      "Hot spots explain why stirring spreads energy more evenly."
    ]
  },
  bicycle: {
    lock: "Bicycle wheel detected",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80",
    alt: "Bicycle wheel close up",
    title: "Torque + Rotation + Friction",
    microTitle: "Spokes share force",
    microText: "Tension keeps the wheel round while friction grips the road.",
    items: [
      "Spin vectors trace angular velocity around the axle.",
      "Friction arrows show where tire rubber pushes backward on the road.",
      "Stress highlights reveal how spokes distribute weight."
    ]
  },
  tree: {
    lock: "Tree detected",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
    alt: "Green tree canopy",
    title: "Photosynthesis + Capillary Action",
    microTitle: "Chloroplasts at work",
    microText: "Leaves turn light, water, and carbon dioxide into stored chemical energy.",
    items: [
      "Light arrows show solar energy entering leaves.",
      "Water pathways show capillary action moving up from roots.",
      "Gas labels reveal carbon dioxide in and oxygen out."
    ]
  },
  soda: {
    lock: "Soda can detected",
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80",
    alt: "Soda can with condensation",
    title: "Pressure + Carbonation + Materials",
    microTitle: "CO2 bubbles escape",
    microText: "Dissolved gas leaves solution when pressure drops after opening.",
    items: [
      "Pressure rings show compressed gas pushing on aluminum.",
      "Bubble paths explain nucleation and fizz.",
      "Material labels compare aluminum strength, mass, and recyclability."
    ]
  },
  cloud: {
    lock: "Cloud detected",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    alt: "Clouds over a landscape",
    title: "Condensation + Weather Systems",
    microTitle: "Droplets gather",
    microText: "Water vapor cools and condenses onto tiny particles in the air.",
    items: [
      "Airflow arrows show warm air rising and cooling.",
      "Droplet animation zooms into condensation nuclei.",
      "Weather labels connect humidity, temperature, and pressure."
    ]
  }
};

const lawData = {
  gravity: {
    badge: "Gravity x2",
    title: "If gravity became 2x stronger...",
    summary:
      "Bodies, buildings, jumps, and transportation all change because weight doubles while mass stays the same.",
    className: "gravity",
    outcomes: [
      ["Sports", "Basketball arcs flatten and high jumps shrink."],
      ["Buildings", "Weak structures sag, crack, or need stronger supports."],
      ["Biology", "Hearts and muscles work harder just to move."],
      ["Transportation", "Cars need more energy and planes need more lift."]
    ]
  },
  oxygen: {
    badge: "Oxygen = 0%",
    title: "If oxygen disappeared...",
    summary:
      "The atmosphere would still contain nitrogen, but breathing, combustion, rusting, and ecosystems would change immediately.",
    className: "oxygen",
    outcomes: [
      ["Biology", "Humans and animals lose the gas needed for cellular respiration."],
      ["Fire", "Flames go out because combustion cannot continue."],
      ["Materials", "Rusting stops, but many exposed metals behave differently."],
      ["Ecosystems", "Food webs collapse as aerobic life loses its energy pathway."]
    ]
  },
  friction: {
    badge: "Friction = 0",
    title: "If friction became zero...",
    summary:
      "Movement would be almost impossible to control because surfaces could no longer grip each other.",
    className: "friction",
    outcomes: [
      ["Transportation", "Tires spin without traction and brakes cannot slow cars."],
      ["Sports", "Shoes cannot grip floors, balls keep sliding, and throws feel strange."],
      ["Buildings", "Screws, nails, knots, and many joints lose holding power."],
      ["Daily Life", "Walking, writing, and picking things up become wildly difficult."]
    ]
  },
  ant: {
    badge: "Human scale: tiny",
    title: "If humans became ant-sized...",
    summary:
      "Scale changes everything: air feels thicker, drops become giant, and strength compared with body weight improves.",
    className: "ant",
    outcomes: [
      ["Biology", "Small bodies lose heat faster and need new ways to stay warm."],
      ["Weather", "Raindrops hit like falling water balloons."],
      ["Transportation", "A crack in the sidewalk becomes a canyon."],
      ["Materials", "Surface tension becomes powerful enough to trap or support us."]
    ]
  },
  boiling: {
    badge: "Boiling point: 72°F",
    title: "If water boiled at room temperature...",
    summary:
      "Liquid water would constantly become vapor in normal conditions, reshaping weather, biology, and cities.",
    className: "boiling",
    outcomes: [
      ["Weather", "Vapor clouds form near the ground and storms become extreme."],
      ["Biology", "Cells struggle because liquid water cannot stay stable."],
      ["Cities", "Pipes, kitchens, farms, and cooling systems need total redesign."],
      ["Earth", "Lakes and oceans rapidly evaporate unless pressure also changes."]
    ]
  }
};

const scannerImage = document.querySelector("#scannerImage");
const objectLock = document.querySelector("#objectLock");
const conceptTitle = document.querySelector("#conceptTitle");
const conceptList = document.querySelector("#conceptList");
const microTitle = document.querySelector("#microTitle");
const microText = document.querySelector("#microText");

document.querySelector("#objectButtons").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-object]");
  if (!button) return;

  document
    .querySelectorAll("#objectButtons button")
    .forEach((item) => item.classList.toggle("active", item === button));

  const data = scannerData[button.dataset.object];
  scannerImage.src = data.image;
  scannerImage.alt = data.alt;
  objectLock.textContent = data.lock;
  conceptTitle.textContent = data.title;
  microTitle.textContent = data.microTitle;
  microText.textContent = data.microText;
  conceptList.innerHTML = data.items.map((item) => `<li>${item}</li>`).join("");
});

const worldVisual = document.querySelector("#worldVisual");
const impactBadge = document.querySelector("#impactBadge");
const lawTitle = document.querySelector("#lawTitle");
const lawSummary = document.querySelector("#lawSummary");
const outcomeGrid = document.querySelector("#outcomeGrid");

document.querySelector("#lawList").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-law]");
  if (!button) return;

  document
    .querySelectorAll("#lawList button")
    .forEach((item) => item.classList.toggle("active", item === button));

  const data = lawData[button.dataset.law];
  worldVisual.className = `world-visual ${data.className}`;
  impactBadge.textContent = data.badge;
  lawTitle.textContent = data.title;
  lawSummary.textContent = data.summary;
  outcomeGrid.innerHTML = data.outcomes
    .map(([title, text]) => `<article><strong>${title}</strong><span>${text}</span></article>`)
    .join("");
});
