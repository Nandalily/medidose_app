const $ = (id) => document.getElementById(id);

const form = $("doseForm");
const doseType = $("doseType");
const calculateBtn = $("calculateBtn");
const inputScreen = $("inputScreen");
const resultScreen = $("resultScreen");
const editBtn = $("editBtn");
const installBtn = $("installBtn");
const installBanner = $("installBanner");
const bannerInstallBtn = $("bannerInstallBtn");
const dismissInstallBtn = $("dismissInstallBtn");

const fields = {
  availableMg: $("availableMg"),
  availableMl: $("availableMl"),
  requiredDose: $("requiredDose"),
  dosePerKg: $("dosePerKg"),
  patientWeight: $("patientWeight"),
  frequency: $("frequency")
};

let deferredInstallPrompt = null;

function numberValue(input) {
  const value = input.value.trim();
  return value === "" ? null : Number(value);
}

function format2(value) {
  return Number(value).toFixed(2);
}

function formatInputNumber(value) {
  return String(value);
}

function setError(input, message) {
  input.classList.toggle("invalid", Boolean(message));
  const error = $(input.id + "Error");
  if (error) error.textContent = message || "";
}

function clearErrors() {
  Object.values(fields).forEach(input => setError(input, ""));
  $("frequencyWarning").textContent = "";
}

function positiveValidation(input, required) {
  const value = numberValue(input);

  if (value === null) {
    return required ? "Required" : "";
  }

  if (!Number.isFinite(value)) return "Enter a valid number";
  if (value <= 0) return "Value must be greater than 0";

  return "";
}

function validate(showErrors = false) {
  const errors = {};
  const type = doseType.value;

  errors.availableMg = positiveValidation(fields.availableMg, true);
  errors.availableMl = positiveValidation(fields.availableMl, true);
  errors.requiredDose = type === "fixed"
    ? positiveValidation(fields.requiredDose, true)
    : "";
  errors.dosePerKg = type === "weight"
    ? positiveValidation(fields.dosePerKg, true)
    : "";
  errors.patientWeight = type === "weight"
    ? positiveValidation(fields.patientWeight, true)
    : "";

  // Frequency is optional. Blank and zero both mean "not provided".
  const frequency = numberValue(fields.frequency);
  errors.frequency = "";
  if (frequency !== null && frequency < 0) {
    errors.frequency = "Value must be greater than 0";
  } else if (frequency !== null && !Number.isInteger(frequency)) {
    errors.frequency = "Enter a whole number";
  }

  if (showErrors) {
    Object.entries(errors).forEach(([id, message]) => setError(fields[id], message));
  }

  const valid = Object.values(errors).every(message => !message);
  return { valid, errors };
}

function updateModeVisuals() {
  const type = doseType.value;
  const fixed = $("fixedField");
  const weight = $("weightField");
  const patient = $("patientWeightField");

  fixed.classList.toggle("de-emphasized", type !== "fixed");
  fixed.classList.toggle("active-mode", type === "fixed");
  weight.classList.toggle("de-emphasized", type !== "weight");
  weight.classList.toggle("active-mode", type === "weight");
  patient.classList.toggle("de-emphasized", type !== "weight");
  patient.classList.toggle("active-mode", type === "weight");
}

function updateFrequencyMessage() {
  const frequency = numberValue(fields.frequency);
  const warning = $("frequencyWarning");
  warning.textContent = frequency !== null && frequency > 24
    ? "Please double check this frequency"
    : "";
}

function updateCalculateState() {
  const { valid } = validate(false);
  calculateBtn.disabled = !valid;
  updateModeVisuals();
  updateFrequencyMessage();
}

Object.values(fields).forEach(input => {
  input.addEventListener("input", () => {
    // Reject non-finite numeric values at the UI validation layer.
    updateCalculateState();
    if (input.classList.contains("invalid")) {
      const result = validate(false);
      setError(input, result.errors[input.id] || "");
    }
  });

  input.addEventListener("blur", () => {
    const result = validate(true);
    if (result.valid) updateCalculateState();
  });
});

doseType.addEventListener("change", () => {
  clearErrors();
  updateCalculateState();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const result = validate(true);
  if (!result.valid) {
    updateCalculateState();
    return;
  }

  const availableMg = numberValue(fields.availableMg);
  const availableMl = numberValue(fields.availableMl);
  const frequency = numberValue(fields.frequency);

  if (availableMl <= 0) {
    setError(fields.availableMl, "Available volume must be greater than 0");
    updateCalculateState();
    return;
  }

  const concentration = availableMg / availableMl;
  let requiredDose;
  let breakdownHtml;

  if (doseType.value === "fixed") {
    requiredDose = numberValue(fields.requiredDose);
    breakdownHtml = `
      <div class="formula">
        <span class="formula-label">Fixed dose</span>
        ${formatInputNumber(requiredDose)} mg ÷ ${formatInputNumber(concentration)} mg/mL = ${format2(requiredDose / concentration)} mL
      </div>
    `;
  } else {
    const dosePerKg = numberValue(fields.dosePerKg);
    const weight = numberValue(fields.patientWeight);
    requiredDose = dosePerKg * weight;

    breakdownHtml = `
      <div class="formula">
        <span class="formula-label">Required dose</span>
        ${formatInputNumber(dosePerKg)} mg/kg × ${formatInputNumber(weight)} kg = ${formatInputNumber(requiredDose)} mg
      </div>
      <div class="formula">
        <span class="formula-label">Volume to administer</span>
        ${formatInputNumber(requiredDose)} mg ÷ ${formatInputNumber(concentration)} mg/mL = ${format2(requiredDose / concentration)} mL
      </div>
    `;
  }

  const volume = requiredDose / concentration;

  $("volumeResult").textContent = format2(volume);
  $("resultSummary").textContent =
    `${formatInputNumber(availableMg)} mg / ${formatInputNumber(availableMl)} mL = ${formatInputNumber(concentration)} mg/mL`;
  $("breakdown").innerHTML = breakdownHtml;

  if (frequency !== null && frequency > 0) {
    $("dailyCard").hidden = false;
    $("dailyResult").textContent = `${format2(volume * frequency)} mL`;
    $("dailyFrequency").textContent = `Frequency: ${formatInputNumber(frequency)} times daily`;
  } else {
    $("dailyCard").hidden = true;
  }

  inputScreen.hidden = true;
  inputScreen.classList.remove("active");
  resultScreen.hidden = false;
  resultScreen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

editBtn.addEventListener("click", () => {
  resultScreen.hidden = true;
  resultScreen.classList.remove("active");
  inputScreen.hidden = false;
  inputScreen.classList.add("active");
  updateCalculateState();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// PWA install support.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.hidden = false;

  // Give the hosted app a gentle install prompt without blocking the calculator.
  if (localStorage.getItem("medidose-install-dismissed") !== "1") {
    setTimeout(() => {
      if (deferredInstallPrompt) installBanner.hidden = false;
    }, 1200);
  }
});

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice.outcome === "accepted") {
    installBanner.hidden = true;
    installBtn.hidden = true;
  }
  deferredInstallPrompt = null;
}

installBtn.addEventListener("click", installApp);
bannerInstallBtn.addEventListener("click", installApp);

dismissInstallBtn.addEventListener("click", () => {
  installBanner.hidden = true;
  localStorage.setItem("medidose-install-dismissed", "1");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBanner.hidden = true;
  installBtn.hidden = true;
});

// Register the service worker for offline/PWA support.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  });
}

updateCalculateState();
