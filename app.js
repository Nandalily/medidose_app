/* =========================================================
   MEDIDOSE — DOSE CALCULATOR
========================================================= */


/* =========================================================
   EXPORT CONFIGURATION
========================================================= */

/*
 * IMPORTANT:
 * This code is NOT a secure password because this application
 * runs entirely in the browser.
 *
 * It is only an export confirmation code.
 *
 * Change this value if you want a different code.
 */

const EXPORT_CODE = "MEDIDOSE2026";


/* =========================================================
   HELPER
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   MAIN ELEMENTS
========================================================= */

const form = $("doseForm");

const doseType = $("doseType");

const calculateBtn = $("calculateBtn");

const inputScreen = $("inputScreen");

const resultScreen = $("resultScreen");

const editBtn = $("editBtn");


/* =========================================================
   INSTALL ELEMENTS
========================================================= */

const installBtn = $("installBtn");

const installBanner = $("installBanner");

const bannerInstallBtn = $("bannerInstallBtn");

const dismissInstallBtn = $("dismissInstallBtn");


/* =========================================================
   EXPORT ELEMENTS
========================================================= */

const exportBtn = $("exportBtn");

const exportModal = $("exportModal");

const closeExportModal = $("closeExportModal");

const cancelExportBtn = $("cancelExportBtn");

const confirmExportBtn = $("confirmExportBtn");

const exportCodeInput = $("exportCode");

const exportCodeError = $("exportCodeError");


/* =========================================================
   INPUT FIELDS
========================================================= */

const fields = {

  availableMg:
    $("availableMg"),

  availableMl:
    $("availableMl"),

  requiredDose:
    $("requiredDose"),

  dosePerKg:
    $("dosePerKg"),

  patientWeight:
    $("patientWeight"),

  frequency:
    $("frequency")

};


/* =========================================================
   STATE
========================================================= */

let deferredInstallPrompt = null;


/*
 * Stores the complete calculation.
 *
 * This is what is later used to create the CSV.
 */

let calculationData = null;


/* =========================================================
   NUMBER HELPERS
========================================================= */

function numberValue(input) {

  const value =
    input.value.trim();

  return value === ""
    ? null
    : Number(value);

}


function format2(value) {

  return Number(value).toFixed(2);

}


function formatInputNumber(value) {

  return String(value);

}


/* =========================================================
   VALIDATION
========================================================= */

function setError(input, message) {

  input.classList.toggle(
    "invalid",
    Boolean(message)
  );

  const error =
    $(input.id + "Error");

  if (error) {

    error.textContent =
      message || "";

  }

}


function clearErrors() {

  Object.values(fields).forEach(
    input => setError(input, "")
  );

  $("frequencyWarning").textContent = "";

}


function positiveValidation(input, required) {

  const value =
    numberValue(input);


  if (value === null) {

    return required
      ? "Required"
      : "";

  }


  if (!Number.isFinite(value)) {

    return "Enter a valid number";

  }


  if (value <= 0) {

    return "Value must be greater than 0";

  }


  return "";

}


function validate(showErrors = false) {

  const errors = {};

  const type =
    doseType.value;


  /*
   * Concentration is always required.
   */

  errors.availableMg =
    positiveValidation(
      fields.availableMg,
      true
    );


  errors.availableMl =
    positiveValidation(
      fields.availableMl,
      true
    );


  /*
   * Fixed-dose validation.
   */

  errors.requiredDose =
    type === "fixed"
      ? positiveValidation(
          fields.requiredDose,
          true
        )
      : "";


  /*
   * Weight-based validation.
   */

  errors.dosePerKg =
    type === "weight"
      ? positiveValidation(
          fields.dosePerKg,
          true
        )
      : "";


  errors.patientWeight =
    type === "weight"
      ? positiveValidation(
          fields.patientWeight,
          true
        )
      : "";


  /*
   * Frequency is optional.
   *
   * Blank = not provided.
   * Zero = not provided.
   */

  const frequency =
    numberValue(fields.frequency);


  errors.frequency = "";


  if (
    frequency !== null &&
    frequency < 0
  ) {

    errors.frequency =
      "Value must be greater than 0";

  }
  else if (
    frequency !== null &&
    !Number.isInteger(frequency)
  ) {

    errors.frequency =
      "Enter a whole number";

  }


  if (showErrors) {

    Object.entries(errors).forEach(
      ([id, message]) => {

        setError(
          fields[id],
          message
        );

      }
    );

  }


  const valid =
    Object.values(errors)
      .every(
        message => !message
      );


  return {
    valid,
    errors
  };

}


/* =========================================================
   MODE DISPLAY
========================================================= */

function updateModeVisuals() {

  const type =
    doseType.value;


  const fixed =
    $("fixedField");


  const weight =
    $("weightField");


  const patient =
    $("patientWeightField");


  fixed.classList.toggle(
    "de-emphasized",
    type !== "fixed"
  );


  fixed.classList.toggle(
    "active-mode",
    type === "fixed"
  );


  weight.classList.toggle(
    "de-emphasized",
    type !== "weight"
  );


  weight.classList.toggle(
    "active-mode",
    type === "weight"
  );


  patient.classList.toggle(
    "de-emphasized",
    type !== "weight"
  );


  patient.classList.toggle(
    "active-mode",
    type === "weight"
  );

}


/* =========================================================
   FREQUENCY WARNING
========================================================= */

function updateFrequencyMessage() {

  const frequency =
    numberValue(fields.frequency);


  const warning =
    $("frequencyWarning");


  warning.textContent =
    frequency !== null &&
    frequency > 24

      ? "Please double check this frequency"

      : "";

}


/* =========================================================
   CALCULATE BUTTON
========================================================= */

function updateCalculateState() {

  const { valid } =
    validate(false);


  calculateBtn.disabled =
    !valid;


  updateModeVisuals();

  updateFrequencyMessage();

}


/* =========================================================
   FIELD LISTENERS
========================================================= */

Object.values(fields).forEach(
  input => {

    input.addEventListener(
      "input",
      () => {

        updateCalculateState();


        if (
          input.classList.contains(
            "invalid"
          )
        ) {

          const result =
            validate(false);


          setError(
            input,
            result.errors[input.id] || ""
          );

        }

      }
    );


    input.addEventListener(
      "blur",
      () => {

        const result =
          validate(true);


        if (result.valid) {

          updateCalculateState();

        }

      }
    );

  }
);


/* =========================================================
   DOSE TYPE
========================================================= */

doseType.addEventListener(
  "change",
  () => {

    clearErrors();

    updateCalculateState();

  }
);


/* =========================================================
   CALCULATE
========================================================= */

form.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    const result =
      validate(true);


    if (!result.valid) {

      updateCalculateState();

      return;

    }


    /* -----------------------------------------
       READ VALUES
    ----------------------------------------- */

    const availableMg =
      numberValue(
        fields.availableMg
      );


    const availableMl =
      numberValue(
        fields.availableMl
      );


    const frequency =
      numberValue(
        fields.frequency
      );


    /* -----------------------------------------
       AVAILABLE VOLUME CHECK
    ----------------------------------------- */

    if (availableMl <= 0) {

      setError(
        fields.availableMl,
        "Available volume must be greater than 0"
      );


      updateCalculateState();

      return;

    }


    /* -----------------------------------------
       CONCENTRATION
    ----------------------------------------- */

    const concentration =
      availableMg /
      availableMl;


    let requiredDose;

    let breakdownHtml;

    let calculationBreakdown = [];


    /* =================================================
       FIXED DOSE
    ================================================= */

    if (
      doseType.value === "fixed"
    ) {

      requiredDose =
        numberValue(
          fields.requiredDose
        );


      const volume =
        requiredDose /
        concentration;


      calculationBreakdown = [

        `${formatInputNumber(requiredDose)} mg ÷ ${formatInputNumber(concentration)} mg/mL = ${format2(volume)} mL`

      ];


      breakdownHtml = `

        <div class="formula">

          <span class="formula-label">
            Fixed dose
          </span>

          ${formatInputNumber(requiredDose)}
          mg ÷
          ${formatInputNumber(concentration)}
          mg/mL =
          ${format2(volume)}
          mL

        </div>

      `;

    }


    /* =================================================
       WEIGHT BASED
    ================================================= */

    else {

      const dosePerKg =
        numberValue(
          fields.dosePerKg
        );


      const weight =
        numberValue(
          fields.patientWeight
        );


      requiredDose =
        dosePerKg *
        weight;


      const volume =
        requiredDose /
        concentration;


      calculationBreakdown = [

        `${formatInputNumber(dosePerKg)} mg/kg × ${formatInputNumber(weight)} kg = ${formatInputNumber(requiredDose)} mg`,

        `${formatInputNumber(requiredDose)} mg ÷ ${formatInputNumber(concentration)} mg/mL = ${format2(volume)} mL`

      ];


      breakdownHtml = `

        <div class="formula">

          <span class="formula-label">
            Required dose
          </span>

          ${formatInputNumber(dosePerKg)}
          mg/kg ×
          ${formatInputNumber(weight)}
          kg =
          ${formatInputNumber(requiredDose)}
          mg

        </div>


        <div class="formula">

          <span class="formula-label">
            Volume to administer
          </span>

          ${formatInputNumber(requiredDose)}
          mg ÷
          ${formatInputNumber(concentration)}
          mg/mL =
          ${format2(volume)}
          mL

        </div>

      `;

    }


    /* =================================================
       FINAL VOLUME
    ================================================= */

    const volume =
      requiredDose /
      concentration;


    /* =================================================
       DISPLAY RESULT
    ================================================= */

    $("volumeResult").textContent =
      format2(volume);


    $("resultSummary").textContent =

      `${formatInputNumber(availableMg)} mg / ${formatInputNumber(availableMl)} mL = ${formatInputNumber(concentration)} mg/mL`;


    $("breakdown").innerHTML =
      breakdownHtml;


    /* =================================================
       DAILY VOLUME
    ================================================= */

    let totalDailyVolume =
      null;


    if (
      frequency !== null &&
      frequency > 0
    ) {

      totalDailyVolume =
        volume *
        frequency;


      $("dailyCard").hidden =
        false;


      $("dailyResult").textContent =
        `${format2(totalDailyVolume)} mL`;


      $("dailyFrequency").textContent =

        `Frequency: ${formatInputNumber(frequency)} times daily`;

    }

    else {

      $("dailyCard").hidden =
        true;

    }


    /* =================================================
       SAVE COMPLETE CALCULATION
       FOR CSV EXPORT
    ================================================= */

    calculationData = {

      doseType:
        doseType.value === "fixed"
          ? "Fixed dose"
          : "Weight-based dose",

      availableMg,

      availableMl,

      concentration,

      requiredDose:
        doseType.value === "fixed"
          ? numberValue(
              fields.requiredDose
            )
          : null,

      dosePerKg:
        doseType.value === "weight"
          ? numberValue(
              fields.dosePerKg
            )
          : null,

      patientWeight:
        doseType.value === "weight"
          ? numberValue(
              fields.patientWeight
            )
          : null,

      frequency:
        frequency !== null &&
        frequency > 0
          ? frequency
          : null,

      calculatedRequiredDose:
        requiredDose,

      volumePerDose:
        volume,

      totalDailyVolume,

      calculationBreakdown,

      calculatedAt:
        new Date()

    };


    /* =================================================
       SHOW RESULT SCREEN
    ================================================= */

    inputScreen.hidden =
      true;


    inputScreen.classList.remove(
      "active"
    );


    resultScreen.hidden =
      false;


    resultScreen.classList.add(
      "active"
    );


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }
);


/* =========================================================
   BACK / EDIT
========================================================= */

editBtn.addEventListener(
  "click",
  () => {

    resultScreen.hidden =
      true;


    resultScreen.classList.remove(
      "active"
    );


    inputScreen.hidden =
      false;


    inputScreen.classList.add(
      "active"
    );


    updateCalculateState();


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }
);


/* =========================================================
   EXPORT MODAL
========================================================= */

function openExportModal() {

  exportCodeInput.value =
    "";

  exportCodeError.textContent =
    "";

  exportModal.hidden =
    false;


  setTimeout(
    () => exportCodeInput.focus(),
    50
  );

}


function closeExportModalWindow() {

  exportModal.hidden =
    true;

  exportCodeInput.value =
    "";

  exportCodeError.textContent =
    "";

}


/* =========================================================
   EXPORT BUTTON
========================================================= */

exportBtn.addEventListener(
  "click",
  () => {

    if (!calculationData) {

      return;

    }

    openExportModal();

  }
);


/* =========================================================
   CLOSE MODAL
========================================================= */

closeExportModal.addEventListener(
  "click",
  closeExportModalWindow
);


cancelExportBtn.addEventListener(
  "click",
  closeExportModalWindow
);


/*
 * Clicking outside the modal closes it.
 */

exportModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      exportModal
    ) {

      closeExportModalWindow();

    }

  }
);


/*
 * Escape key closes the modal.
 */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      !exportModal.hidden
    ) {

      closeExportModalWindow();

    }

  }
);


/* =========================================================
   EXPORT CODE
========================================================= */

function verifyExportCode() {

  const enteredCode =
    exportCodeInput.value.trim();


  if (!enteredCode) {

    exportCodeError.textContent =
      "Please enter the export code.";

    exportCodeInput.classList.add(
      "invalid"
    );

    return false;

  }


  if (
    enteredCode !==
    EXPORT_CODE
  ) {

    exportCodeError.textContent =
      "Incorrect export code.";

    exportCodeInput.classList.add(
      "invalid"
    );

    return false;

  }


  exportCodeError.textContent =
    "";

  exportCodeInput.classList.remove(
    "invalid"
  );


  return true;

}


exportCodeInput.addEventListener(
  "input",
  () => {

    exportCodeInput.classList.remove(
      "invalid"
    );

    exportCodeError.textContent =
      "";

  }
);


/* =========================================================
   CSV HELPERS
========================================================= */


/*
 * Escapes CSV values correctly.
 *
 * This protects values containing commas,
 * quotation marks, or line breaks.
 */

function csvEscape(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  const stringValue =
    String(value);


  return `"${stringValue.replace(
    /"/g,
    '""'
  )}"`;

}


/*
 * Creates a CSV row.
 */

function csvRow(...values) {

  return values
    .map(csvEscape)
    .join(",");

}


/* =========================================================
   CREATE CSV
========================================================= */

function createCalculationCSV(data) {

  const date =
    data.calculatedAt;


  const dateString =
    date.toLocaleString();


  const rows = [];


  /*
   * CSV title
   */

  rows.push(
    csvRow(
      "MEDIDOSE CALCULATION"
    )
  );


  rows.push(
    ""
  );


  /*
   * Basic information
   */

  rows.push(
    csvRow(
      "Calculation Date",
      dateString
    )
  );


  rows.push(
    csvRow(
      "Dose Type",
      data.doseType
    )
  );


  rows.push(
    ""
  );


  /*
   * Medicine concentration
   */

  rows.push(
    csvRow(
      "MEDICINE CONCENTRATION"
    )
  );


  rows.push(
    csvRow(
      "Available Medicine Amount",
      `${data.availableMg} mg`
    )
  );


  rows.push(
    csvRow(
      "Available Medicine Volume",
      `${data.availableMl} mL`
    )
  );


  rows.push(
    csvRow(
      "Derived Concentration",
      `${data.concentration} mg/mL`
    )
  );


  rows.push(
    ""
  );


  /*
   * Dose details
   */

  rows.push(
    csvRow(
      "DOSE DETAILS"
    )
  );


  if (
    data.doseType ===
    "Fixed dose"
  ) {

    rows.push(
      csvRow(
        "Required Dose",
        `${data.requiredDose} mg`
      )
    );

  }


  if (
    data.doseType ===
    "Weight-based dose"
  ) {

    rows.push(
      csvRow(
        "Dose per Kg",
        `${data.dosePerKg} mg/kg`
      )
    );


    rows.push(
      csvRow(
        "Patient Weight",
        `${data.patientWeight} kg`
      )
    );


    rows.push(
      csvRow(
        "Calculated Required Dose",
        `${data.calculatedRequiredDose} mg`
      )
    );

  }


  /*
   * Frequency
   */

  rows.push(
    csvRow(
      "Frequency",
      data.frequency
        ? `${data.frequency} times/day`
        : "Not provided"
    )
  );


  rows.push(
    ""
  );


  /*
   * Result
   */

  rows.push(
    csvRow(
      "RESULT"
    )
  );


  rows.push(
    csvRow(
      "Volume Per Dose",
      `${format2(data.volumePerDose)} mL`
    )
  );


  if (
    data.totalDailyVolume !== null
  ) {

    rows.push(
      csvRow(
        "Total Daily Volume",
        `${format2(data.totalDailyVolume)} mL`
      )
    );

  }


  rows.push(
    ""
  );


  /*
   * Calculation breakdown
   */

  rows.push(
    csvRow(
      "CALCULATION BREAKDOWN"
    )
  );


  data.calculationBreakdown
    .forEach(
      (step, index) => {

        rows.push(
          csvRow(
            `Step ${index + 1}`,
            step
          )
        );

      }
    );


  rows.push(
    ""
  );


  /*
   * Safety note
   */

  rows.push(
    csvRow(
      "Safety Note",
      "MEDIDOSE performs the arithmetic only. Always verify against the prescription and consult a healthcare professional before administering any medication."
    )
  );


  return rows.join("\r\n");

}


/* =========================================================
   DOWNLOAD CSV
========================================================= */

function downloadCSV() {

  if (!calculationData) {

    return;

  }


  const csv =
    createCalculationCSV(
      calculationData
    );


  /*
   * Add UTF-8 BOM so Excel
   * correctly recognizes the file.
   */

  const csvWithBom =
    "\uFEFF" + csv;


  const blob =
    new Blob(
      [csvWithBom],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  const date =
    new Date();


  const datePart =
    date
      .toISOString()
      .slice(0, 10);


  const timePart =
    date
      .toTimeString()
      .slice(0, 8)
      .replace(
        /:/g,
        "-"
      );


  link.href =
    url;


  link.download =
    `MEDIDOSE-calculation-${datePart}-${timePart}.csv`;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}


/* =========================================================
   CONFIRM EXPORT
========================================================= */

confirmExportBtn.addEventListener(
  "click",
  () => {

    if (
      !verifyExportCode()
    ) {

      return;

    }


    downloadCSV();


    closeExportModalWindow();

  }
);


/*
 * Allow Enter to submit the code.
 */

exportCodeInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      confirmExportBtn.click();

    }

  }
);


/* =========================================================
   PWA INSTALL SUPPORT
========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  (event) => {

    /*
     * Prevent the browser's automatic
     * install prompt.
     */

    event.preventDefault();


    deferredInstallPrompt =
      event;


    installBtn.hidden =
      false;


    /*
     * Show a gentle install banner.
     */

    if (
      localStorage.getItem(
        "medidose-install-dismissed"
      ) !== "1"
    ) {

      setTimeout(
        () => {

          if (
            deferredInstallPrompt
          ) {

            installBanner.hidden =
              false;

          }

        },
        1200
      );

    }

  }
);


/* =========================================================
   INSTALL APP
========================================================= */

async function installApp() {

  if (
    !deferredInstallPrompt
  ) {

    return;

  }


  deferredInstallPrompt.prompt();


  const choice =
    await deferredInstallPrompt.userChoice;


  if (
    choice.outcome ===
    "accepted"
  ) {

    installBanner.hidden =
      true;

    installBtn.hidden =
      true;

  }


  deferredInstallPrompt =
    null;

}


/* =========================================================
   INSTALL BUTTONS
========================================================= */

installBtn.addEventListener(
  "click",
  installApp
);


bannerInstallBtn.addEventListener(
  "click",
  installApp
);


/* =========================================================
   DISMISS INSTALL BANNER
========================================================= */

dismissInstallBtn.addEventListener(
  "click",
  () => {

    installBanner.hidden =
      true;


    localStorage.setItem(
      "medidose-install-dismissed",
      "1"
    );

  }
);


/* =========================================================
   APP INSTALLED
========================================================= */

window.addEventListener(
  "appinstalled",
  () => {

    deferredInstallPrompt =
      null;


    installBanner.hidden =
      true;


    installBtn.hidden =
      true;

  }
);


/* =========================================================
   SERVICE WORKER
========================================================= */

// if (
//   "serviceWorker" in navigator
// ) {

//   window.addEventListener(
//     "load",
//     () => {

//       navigator.serviceWorker
//         .register("./sw.js")
//         .catch(
//           console.error
//         );

//     }
//   );

// }


/* =========================================================
   INITIALIZE
========================================================= */

updateCalculateState();