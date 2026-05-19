const particleField = document.querySelector("#particleField");
const launchLab = document.querySelector("#launchLab");
const replayTop = document.querySelector("#replayTop");
const angleButtons = document.querySelector("#angleButtons");
const angleFeedback = document.querySelector("#angleFeedback");
const angleSim = document.querySelector("#angleSim");
const rewardScreen = document.querySelector("#rewardScreen");

const angleResults = {
  30: "30° shoots forward fast, but it drops sooner because it does not climb high enough.",
  45: "Correct. 45° balances upward lift and forward speed, so it travels farthest.",
  90: "90° goes high, but almost all the energy points upward instead of forward.",
};

function buildParticles() {
  if (!particleField) return;

  for (let index = 0; index < 34; index += 1) {
    const particle = document.createElement("span");
    particle.className = "nfc-particle";
    particle.style.setProperty("--x", `${Math.random() * 100}%`);
    particle.style.setProperty("--y", `${Math.random() * 100}%`);
    particle.style.setProperty("--delay", `${Math.random() * -14}s`);
    particle.style.setProperty("--size", `${6 + Math.random() * 16}px`);
    particle.style.setProperty("--drift", `${28 + Math.random() * 80}px`);
    particleField.appendChild(particle);
  }
}

function replayMission() {
  if (!launchLab) return;

  launchLab.classList.remove("play");
  launchLab.offsetHeight;
  launchLab.classList.add("play");
}

function chooseAngle(angle) {
  const selectedAngle = String(angle);

  angleButtons.querySelectorAll("button").forEach((button) => {
    const isSelected = button.dataset.angle === selectedAngle;
    const isCorrect = selectedAngle === "45";
    button.classList.toggle("selected", isSelected);
    button.classList.toggle("correct", isSelected && isCorrect);
    button.classList.toggle("miss", isSelected && !isCorrect);
  });

  angleSim.dataset.angle = selectedAngle;
  angleSim.classList.remove("launching");
  angleSim.offsetHeight;
  angleSim.classList.add("launching");
  angleFeedback.textContent = angleResults[selectedAngle];
  rewardScreen.classList.toggle("unlocked", selectedAngle === "45");
}

buildParticles();
replayMission();

replayTop?.addEventListener("click", replayMission);

angleButtons?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-angle]");
  if (!button) return;

  chooseAngle(button.dataset.angle);
});
