// Reuse of common methods that allow access to the DOM
const $ = (selector) => document.querySelector(selector);
const $All = (selector) => document.querySelectorAll(selector);

// Utility methods
const roundNumberToTwoDecimals = (value) => {
  if (!String(value).includes('.')) {
    return value
  }

  return Number(value.toFixed(2))
}

const formattingPhase = (phaseWithoutFormat) => phaseWithoutFormat.replace(' ', '_').toUpperCase()

// Desclaration
const calculatorForm = $('#calculator-form')
const ampsField = $('#amps')
const kiloWattsField = $('#kilo-watts')

// To force entries to allow only numbers
$All('input[type="text"]').forEach(function (input) {
  input.addEventListener('input', function () {
    if (!this.value.match(/^[0-9]*[.]?[0-9]*$/)) {
      this.value = this.previousValue || ''
      return
    }

    this.previousValue = this.value
  })
})

/*
  In this part, all the form data is retrieved and validation is applied in order
  to receive the appropriate data.
*/
const handleOnSubmit = (e) => {
  e.preventDefault()
  const data = Object.fromEntries(new FormData(calculatorForm))

  const { kiloWatts, amps, lengthCableMeter, lengthCableFeet } = data

  if (kiloWatts === '' || amps === '' || lengthCableMeter === '' || lengthCableFeet === '') {
    alert('Please make sure that there are no empty fields.')
    return
  }

  if (isNaN(kiloWatts) || isNaN(amps) || isNaN(lengthCableMeter) || isNaN(lengthCableFeet)) {
    alert('Please make sure you have filled in the fields with numbers.')
    return
  }


  void calculate(data)
  calculatorForm.reset()
}

const calculatorForm = $('#calculator-form');
calculatorForm.addEventListener('submit', handleOnSubmit)

const calculateAgainButton = document.getElementById('calculate-again');
calculateAgainButton.addEventListener('click', function() {
    calculatorForm.reset();
    const containerResults = document.querySelector('.container_results');
    if (containerResults) {
        containerResults.innerHTML = '';
    }
});

// Methods to convert units of KILOWATTS to AMPS and vice versa
const SINGLE_PHASE_VOLTAGE = 230
const THREE_PHASE_VOLTAGE = 320
const THREE_PHASE_FACTOR = (Math.sqrt(3) * THREE_PHASE_VOLTAGE)

const convertKiloWattsToAmps = (kiloWatts, phase = "SINGLE_PHASE") => {
  const POWER = (kiloWatts * 1000); // converting kiloWatts to Watts

  if (phase === "THREE_PHASE") {
    return roundNumberToTwoDecimals((POWER / (Math.sqrt(3) * THREE_PHASE_VOLTAGE)));
  }

  // Default to single phase calculation
  return roundNumberToTwoDecimals((POWER / SINGLE_PHASE_VOLTAGE));
}

const convertAmpsToKiloWatts = (amps, phase = "SINGLE_PHASE") => {
  if (phase === "THREE_PHASE") {
    return roundNumberToTwoDecimals(((amps * THREE_PHASE_FACTOR) / 1000))
  }

  return roundNumberToTwoDecimals(((amps * SINGLE_PHASE_VOLTAGE) / 1000))
}

/*
  In this part, I will use the formulas created to convert in the KiloWatts
  and Amps fields each time the focus outside is registered in them field, also
  the phase change.
*/
let currentPhase = null

const handlePhaseChange = function (e) {
  const phaseWithoutFormat = this.options[this.selectedIndex]?.value
  const phaseFormated = formattingPhase(phaseWithoutFormat)

  currentPhase = phaseFormated

  const formatKiloWantts = Number(kiloWattsField.value)

  if (kiloWattsField.value === '' || !formatKiloWantts) return

  ampsField.value = convertKiloWattsToAmps(formatKiloWantts, phaseFormated)
}

const handleFocusOutsideKiloWatts = () => {
  const formatKiloWantts = Number(kiloWattsField.value)

  if (kiloWattsField.value === '' || !formatKiloWantts) return

  ampsField.value = convertKiloWattsToAmps(formatKiloWantts, currentPhase ?? 'SINGLE_PHASE')
  location.hash = '#calculator'
}

const handleFocusOutsideAmps = () => {
  const formatAmps = Number(ampsField.value)

  if (ampsField.value === '' || isNaN(formatAmps)) return

  kiloWattsField.value = convertAmpsToKiloWatts(formatAmps, currentPhase ?? 'SINGLE_PHASE')
  location.hash = '#calculator'
}

kiloWattsField.addEventListener('focusout', handleFocusOutsideKiloWatts)
ampsField.addEventListener('focusout', handleFocusOutsideAmps)

$('#phase').addEventListener('change', handlePhaseChange)


/*
  In this part it is converted from meter to feet and vice versa, just as it was
  done with kilowatts and amps to fill the fields when the focus is off.
*/
const FACTOR_METER = 3.281

const convertMeterToFeet = (meter) => {
  return roundNumberToTwoDecimals((meter * FACTOR_METER))
}

const convertFeetToMeter = (feet) => {
  return roundNumberToTwoDecimals((feet / FACTOR_METER))
}

const lengthCableMeterField = $('#length-cable-meter')
const lengthCableFeetField = $('#length-cable-feet')

const handleFocusOutsideMeterToFeet = () => {
  const lengthCableMeterFormated = Number(lengthCableMeterField.value)

  if (lengthCableMeterField.value === '' || isNaN(lengthCableMeterFormated)) return

  lengthCableFeetField.value = convertMeterToFeet(lengthCableMeterFormated)
  location.hash = '#calculator'
}

const handleFocusOutsideFeetToMeeter = () => {
  const lengthCableFeetFormated = Number(lengthCableFeetField.value)

  if (lengthCableFeetField.value === '' || isNaN(lengthCableFeetFormated)) return

  lengthCableMeterField.value = convertFeetToMeter(lengthCableFeetFormated)
  location.hash = '#calculator'
}

lengthCableMeterField.addEventListener('focusout', handleFocusOutsideMeterToFeet)
lengthCableFeetField.addEventListener('focusout', handleFocusOutsideFeetToMeeter)

// Cable sizing calculation logic
async function calculate(data) {
  const { amps, kiloWatts, lengthCableFeet, lengthCableMeter, methodInstallation, phase, voltageDrop } = data;
  const containerResults = $('.container_results');

  containerResults.innerHTML = '';

  try {
    const results = document.createElement('div');
    results.setAttribute('id', 'results');
    containerResults.appendChild(results);

    const cables = await calculateCableSize(formattingPhase(phase).toLowerCase(), Number(voltageDrop), Number(amps), Number(lengthCableMeter), methodInstallation);

    // Generate and insert navigation buttons
    const navigationButtonsHTML = generateNavigationButtons(cables);
    const navContainer = document.getElementById('navigation-container');
    navContainer.innerHTML = navigationButtonsHTML;

    let resultHTML = '';
    for (let i = 0; i < cables.length; i++) {
      let cable = cables[i];

      if (cable.message) {
        const { short_title, sub_title, message } = cable;
        resultHTML += renderCalculateMessage(short_title, sub_title, message);
      } else {
        const { shortTitle, sub_title, cableSize, methodInstallation, voltage } = cable;
        // Add the ID to the renderResults call
        resultHTML += renderResults(shortTitle, sub_title, voltage, kiloWatts, amps, lengthCableMeter, lengthCableFeet, methodInstallation, cableSize, 'result_' + i);
      }
    }

    results.innerHTML = renderResult(resultHTML);
  } catch (err) {
    containerResults.innerHTML = renderErrorMessageTemplate();
  } finally {
    isLoading = false;
  }
}


// templates
function renderResult(results) {
  return `
	<div class="cards_container">${results}</div>
  `;
}

function renderLoaderTemplate() {
  return `
  <div class="loader">
    <div class="spinner"></div>
    <p>Calculating...</p>
  </div>
  `
}

function renderErrorMessageTemplate() {
  return `<div class="error_message">An error occurred during the calculation!</div>`
}

function renderCalculateMessage(cableName, tableToApply, message) {
  return `
  <article class="card">
		<h2 class="card_heading">${cableName}</h2>
		<figure class="card_item">
			<figcaption class="item_name">Tables Apply to</figcaption>
			<p class="item_data table_apply">${tableToApply}</p>
		</figure>
		<figure class="card_item">
			<p class="item_data">${message}</p>
		</figure>
  </article>
  `
}

function renderResults(cableName, tableToApply, voltage, kiloWatts, amps, meter, feet, methodInstallation, cableSize, id) {
  return `
  <article class="card" id="${id}">
		<h2 class="card_heading">${cableName}</h2>
		<figure class="card_item">
			<figcaption class="item_name">Tables Apply to</figcaption>
			<p class="item_data">${tableToApply}</p>
		</figure>
		<figure class="card_item">
			<figcaption class="item_name">Voltage</figcaption>
			<p class="item_data">${voltage}</p>
		</figure>
		<figure class="card_item">
			<figcaption class="item_name">Load</figcaption>
			<p class="item_data">${kiloWatts}kW / ${amps}A</p>
		</figure>
		<figure class="card_item">
			<figcaption class="item_name">Length</figcaption>
			<p class="item_data">${feet}ft / ${meter}m</p>
		</figure>
		<figure class="card_item">
			<figcaption class="item_name">
				Method of Installation
			</figcaption>
			<p class="item_data">${methodInstallation}</p>
		</figure>
		<figure class="card_item">
			<figcaption class="active-cable-size">Cable Size</figcaption>
			<p class="active-cable-size">${cableSize}mm²</p>
		</figure>
	</article>
  `
}

// New function to generate navigation buttons
function generateNavigationButtons(cables) {
  return cables.map((cable, index) => {
    // Check if the shortTitle is not undefined
    if (typeof cable.shortTitle !== 'undefined') {
      return `<button class="result-nav-button" onclick="scrollToResult('result_${index}')">${cable.shortTitle}</button>`;
    }
    return ''; // Return an empty string if shortTitle is undefined
  }).join('');
}

// New function for smooth scrolling to result
function scrollToResult(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Data
const TABLES = [
  {
    id: 1,
    title: 'Single Core 70°C Thermoplastic Insulated Cables, Non Armoured, With or Without Sheath (COPPER CONDUCTORS)',
    sub_title: 'ST91X, 6491X, 6181Y, TRI-RATED (when installed in conduit or trunking)',
    short_title: 'Single Core 70°C Thermoplastic Insulated Cables, Non Armoured, With or Without Sheath',
    conductor_cross_sectional_area: [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000], // (mm^2)
    method_installation: [
      {
        method_key: 'method-a',
        method_letter: 'A',
        method_name: 'Enclosed in conduit in thermally insulated walls',
        single_phase: [11, 14.5, 20, 26, 34, 46, 61, 80, 99, 119, 151, 182, 210, 240, 273, 321, 367, 0, 0, 0, 0, 0], // Amps
        three_phase: [10.5, 13.5, 18, 24, 31, 42, 59, 73, 89, 108, 136, 164, 188, 216, 245, 286, 328, , 0, 0, 0, 0, 0] // Amps
      },
      {
        method_key: 'method-b',
        method_letter: 'B',
        method_name: 'Enclosed in conduit on a wall or in trunking',
        single_phase: [13.5, 17.5, 24, 32, 41, 57, 76, 101, 125, 151, 192, 232, 269, 300, 341, 400, 458, 546, 626, 720, 0, 0], // Amps
        three_phase: [12, 15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239, 262, 296, 346, 394, 467, 533, 611, 0, 0] // Amps
      },
      {
        method_key: 'method-c',
        method_letter: 'C',
        method_name: 'Clipped direct',
        single_phase: [15.5, 20, 27, 37, 47, 65, 87, 114, 141, 182, 234, 284, 330, 381, 436, 515, 594, 694, 792, 904, 1030, 1154], // Amps
        three_phase: [14, 18, 25, 33, 43, 59, 79, 104, 129, 167, 214, 261, 303, 349, 400, 472, 545, 634, 723, 826, 943, 1058] // Amps
      },
      {
        method_key: 'method-e',
        method_letter: 'E',
        method_name: 'In free air or on a perforated cable tray',
        single_phase: [0, 0, 0, 0, 0, 0, 0, 131, 162, 196, 251, 304, 352, 406, 463, 546, 629, 754, 868, 1005, 1086, 1216], // Amps
        three_phase: [0, 0, 0, 0, 0, 0, 0, 110, 137, 167, 216, 264, 308, 356, 409, 485, 561, 656, 749, 855, 971, 1079] // Amps
      },
    ],
    voltage_drop:
    {
      single_phase: [44, 29, 18, 11, 7.3, 4.4, 2.8, 1.8, 1.3, 1, 0.72, 0.56, 0.47, 0.41, 0.37, 0.33, 0.31, 0.29, 0.27, 0.27, 0, 0], // (mV/A/m)
      three_phase: [38, 25, 15, 9.5, 6.4, 3.8, 2.4, 1.55, 1.1, 0.85, 0.61, 0.48, 0.41, 0.36, 0.32, 0.29, 0.27, 0.25, 0.25, 0.24, 0, 0] // (mV/A/m)
    }
  },
  {
    id: 2,
    title: 'Multicore 70&deg;C Thermoplastic Insulated and Thermoplastic Sheathed Cables, Non Armoured (COPPER CONDUCTORS)',
    sub_title: ' Firesure, Firesure 500, Firesure Plus, Multiuse,(Twin and Earth see also TABLE 4D5)',
    short_title: 'Multicore 70&deg;C Thermoplastic Insulated and Thermoplastic Sheathed Cables, Non Armoured',
    conductor_cross_sectional_area: [1, 1.5, 2.5, 4, 6, 10, 16], // (mm^2)
    method_installation: [
      {
        method_key: 'method-a',
        method_letter: 'A',
        method_name: 'Enclosed in conduit in thermally insulated walls',
        single_phase: [11, 14, 18.5, 25, 32, 43, 57], // Amps
        three_phase: [10, 13, 17.5, 23, 29, 39, 52] // Amps
      },
      {
        method_key: 'method-b',
        method_letter: 'B',
        method_name: 'Enclosed in conduit on a wall or in trunking',
        single_phase: [13, 16.5, 23, 30, 38, 52, 69], // Amps
        three_phase: [11.5, 15, 20, 27, 34, 46, 62] // Amps
      },
      {
        method_key: 'method-c',
        method_letter: 'C',
        method_name: 'Clipped direct',
        single_phase: [15, 19.5, 27, 36, 46, 63, 85], // Amps
        three_phase: [13.5, 17.5, 24, 32, 41, 57, 76] // Amps
      },
      {
        method_key: 'method-e',
        method_letter: 'E',
        method_name: 'In free air or on a perforated cable tray',
        single_phase: [17, 22, 30, 40, 51, 70, 94], // Amps
        three_phase: [14.5, 18.5, 25, 34, 43, 60, 80] // Amps
      },
    ],
    voltage_drop:
    {
      single_phase: [44, 29, 18, 11, 7.3, 4.4, 2.8], // (mV/A/m)
      three_phase: [38, 25, 15, 9.5, 6.4, 3.8, 2.4] // (mV/A/m)
    }
  }
  ,
  {
    id: 3,
    title: 'Single Core 90&deg;C Thermosetting Insulated Cables, Unarmoured, With or Without Sheath (COPPER CONDUCTORS)',
    sub_title: ' 6491B, 6181XY',
    short_title: 'Single Core 90&deg;C Thermosetting Insulated Cables, Unarmoured, With or Without Sheath',
    conductor_cross_sectional_area: [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000], // (mm^2)
    method_installation: [
      {
        method_key: 'method-a',
        method_letter: 'A',
        method_name: 'Enclosed in conduit in thermally insulated walls',
        single_phase: [14, 19, 26, 35, 45, 61, 81, 106, 131, 158, 200, 241, 278, 318, 362, 424, 486, 0, 0, 0, 0, 0], // Amps
        three_phase: [13, 17, 23, 31, 40, 54, 73, 95, 117, 141, 179, 216, 249, 285, 324, 380, 435, 0, 0, 0, 0, 0] // Amps
      },
      {
        method_key: 'method-b',
        method_letter: 'B',
        method_name: 'Enclosed in conduit on a wall or in trunking',
        single_phase: [17, 23, 31, 42, 54, 75, 100, 133, 164, 198, 253, 306, 354, 393, 449, 528, 603, 683, 783, 900, 0, 0], // Amps
        three_phase: [15, 20, 28, 37, 48, 66, 88, 117, 144, 175, 222, 269, 312, 342, 384, 450, 514, 584, 666, 764, 0, 0] // Amps
      },
      {
        method_key: 'method-c',
        method_letter: 'C',
        method_name: 'Clipped direct',
        single_phase: [19, 25, 34, 46, 59, 81, 109, 143, 176, 228, 293, 355, 413, 476, 545, 644, 743, 868, 990, 1130, 1288, 1443], // Amps
        three_phase: [17.5, 23, 31, 41, 54, 74, 99, 130, 161, 209, 268, 326, 379, 4036, 500, 590, 681, 793, 904, 1033, 1179, 1323] // Amps
      },
      {
        method_key: 'method-e',
        method_letter: 'E',
        method_name: 'In free air or on a perforated cable tray',
        single_phase: [0, 0, 0, 0, 0, 0, 0, 161, 200, 242, 310, 377, 437, 504, 575, 679, 783, 940, 1083, 1254, 1358, 1520], // Amps
        three_phase: [0, 0, 0, 0, 0, 0, 0, 135, 169, 207, 268, 328, 383, 444, 510, 607, 703, 823, 946, 1088, 1214, 1349] // Amps
      },
    ],
    voltage_drop:
    {
      single_phase: [46, 31, 19, 12, 7.9, 4.7, 2.9, 1.9, 1.35, 1.05, 0.75, 0.58, 0.48, 0.43, 0.37, 0.33, 0.31, 0.29, 0.28, 0.27, 0, 0], // (mV/A/m)
      three_phase: [40, 27, 16, 10, 6.8, 4, 2.5, 1.65, 1.15, 0.9, 0.65, 0.5, 0.42, 0.37, 0.32, 0.29, 0.27, 0.25, 0.24, 0.23, 0, 0] // (mV/A/m)
    }
  }
  ,
  {
    id: 4,
    title: '70&deg;C Thermoplastic Insulated and Sheathed Flat Cable with Protective Conductor (COPPER CONDUCTORS)',
    sub_title: ' 6241Y, H6242Y, H6243Y',
    short_title: '70&deg;C Thermoplastic Insulated and Sheathed Flat Cable with Protective Conductor',
    conductor_cross_sectional_area: [1, 1.5, 2.5, 4, 6, 10, 16], // (mm^2)
    method_installation: [
      {
        method_key: 'method-a',
        method_letter: 'A',
        method_name: 'Enclosed in conduit in thermally insulated walls',
        single_phase: [11.5, 14.5, 20, 26, 32, 44, 57], // Amps
        three_phase: [11.5, 14.5, 20, 26, 32, 44, 57] // Amps
      },
      {
        method_key: 'method-c',
        method_letter: 'C',
        method_name: 'Clipped direct',
        single_phase: [16, 20, 27, 37, 47, 64, 85], // Amps
        three_phase: [16, 20, 27, 37, 47, 64, 85] // Amps
      },
      {
        method_key: '100',
        method_letter: 'none',
        method_name: 'H6242Y ONLY above a plasterboard ceiling covered by thermal insulation not exceeding 100mm in thickness',
        single_phase: [13, 16, 21, 27, 34, 45, 57], // Amps
        three_phase: [13, 16, 21, 27, 34, 45, 57] // Amps
      },
      {
        method_key: '101',
        method_letter: 'none',
        method_name: 'H6242Y ONLY above a plasterboard ceiling covered by thermal insulation exceeding 100mm in thickness',
        single_phase: [10.5, 13, 17, 22, 27, 36, 46], // Amps
        three_phase: [10.5, 13, 17, 22, 27, 36, 46] // Amps
      },
      {
        method_key: '102',
        method_letter: 'none',
        method_name: 'H6242Y ONLY in a stud wall with thermal insulation with cable touching the inner wall surface',
        single_phase: [13, 16, 21, 27, 35, 47, 63], // Amps
        three_phase: [13, 16, 21, 27, 35, 47, 63] // Amps
      },
      {
        method_key: '103',
        method_letter: 'none',
        method_name: 'H6242Y ONLY in a stud wall with thermal insulation with cable not touching the inner wall surface',
        single_phase: [8, 10, 13.5, 17.5, 23.5, 32, 42.5], // Amps
        three_phase: [8, 10, 13.5, 17.5, 23.5, 32, 42.5] // Amps
      },
    ],
    voltage_drop:
    {
      single_phase: [44, 29, 18, 11, 7.3, 4.4, 2.8], // (mV/A/m)
      three_phase: [44, 29, 18, 11, 7.3, 4.4, 2.8] // (mV/A/m)
    }
  }
  ,
  {
    id: 5,
    title: 'Multicore 90&deg;C Thermosetting Insulated and Thermoplastic Sheathed Cables, Non Armoured (COPPER CONDUCTORS)',
    sub_title: ' 6241B, H6242B, H6243B',
    short_title: 'Multicore 90&deg;C Thermosetting Insulated and Thermoplastic Sheathed Cables, Non Armoured',
    conductor_cross_sectional_area: [1, 1.5, 2.5, 4, 6, 10, 16], // (mm^2)
    method_installation: [
      {
        method_key: 'method-a',
        method_letter: 'A',
        method_name: 'Enclosed in conduit in thermally insulated walls',
        single_phase: [14.5, 18.5, 25, 33, 42, 57, 76], // Amps
        three_phase: [13, 16.5, 22, 30, 38, 51, 68] // Amps
      },
      {
        method_key: 'method-b',
        method_letter: 'B',
        method_name: 'Enclosed in conduit on a wall or in trunking',
        single_phase: [17, 22, 30, 40, 51, 69, 91], // Amps
        three_phase: [15, 19.5, 26, 35, 44, 60, 80] // Amps
      },
      {
        method_key: 'method-c',
        method_letter: 'C',
        method_name: 'Clipped direct',
        single_phase: [19, 24, 33, 45, 58, 80, 107], // Amps
        three_phase: [14, 22, 30, 40, 52, 71, 96] // Amps
      },
      {
        method_key: 'method-e',
        method_letter: 'E',
        method_name: 'In free air or on a perforated cable tray',
        single_phase: [21, 26, 36, 49, 63, 86, 115], // Amps
        three_phase: [18, 23, 32, 42, 54, 75, 100] // Amps
      },
    ],
    voltage_drop:
    {
      single_phase: [46, 31, 19, 12, 7.9, 4.7, 2.9], // (mV/A/m)
      three_phase: [40, 27, 16, 10, 6.8, 4, 2.5] // (mV/A/m)
    }
  }
  ,
  {
    id: 6,
    title: 'Multicore 90&deg;C Armoured Thermosetting Insulated Cables (COPPER CONDUCTORS)',
    sub_title: ' H6942XL, H6943XL, H6944XL, H6945XL, Tuff Sheath',
    short_title: 'Multicore 90&deg;C Armoured Thermosetting Insulated Cables',
    conductor_cross_sectional_area: [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400], // (mm^2)
    method_installation: [
      {
        method_key: 'method-c',
        method_letter: 'C',
        method_name: 'Clipped direct',
        single_phase: [27, 36, 49, 62, 85, 110, 146, 180, 219, 279, 338, 392, 451, 515, 607, 698, 787], // Amps
        three_phase: [23, 31, 42, 53, 73, 94, 124, 154, 187, 238, 289, 335, 386, 441, 520, 599, 673] // Amps
      },
      {
        method_key: 'method-d',
        method_letter: 'D',
        method_name: 'Direct in ground or in ducting in ground',
        single_phase: [25, 33, 46, 53, 71, 91, 116, 139, 164, 203, 239, 271, 306, 343, 395, 446, 0], // Amps
        three_phase: [21, 28, 36, 44, 58, 75, 96, 115, 135, 167, 197, 223, 251, 281, 324, 365, 0] // Amps
      },
      {
        method_key: 'method-e',
        method_letter: 'E',
        method_name: 'In free air or on a perforated cable tray',
        single_phase: [29, 39, 52, 66, 90, 115, 152, 188, 228, 291, 354, 410, 472, 539, 636, 732, 847], // Amps
        three_phase: [25, 33, 44, 56, 78, 99, 131, 162, 197, 251, 304, 353, 406, 463, 546, 628, 728] // Amps
      },
    ],
    voltage_drop:
    {
      single_phase: [31, 19, 12, 7.9, 4.7, 2.9, 1.9, 1.35, 1, 0.69, 0.52, 0.42, 0.35, 0.29, 0.24, 0.21, 0.19], // (mV/A/m)
      three_phase: [27, 16, 10, 6.8, 4, 2.5, 1.65, 1.15, 0.87, 0.6, 0.45, 0.37, 0.3, 0.26, 0.21, 0.185, 0.165] // (mV/A/m)
    }
  }
  ,
  {
    id: 7,
    title: 'Flexible Cords',
    sub_title: 'Flexible cords such as 318-Y, 309-Y, H07RN-F, SY, CY, YY',
    short_title: 'Flexible Cords',
    conductor_cross_sectional_area: [0.5, 0.75, 1, 1.25, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630], // (mm^2)
    method_installation: [
      {
        method_key: 'method-a',
        method_letter: 'A',
        method_name: 'Enclosed in conduit in thermally insulated walls',
        single_phase: [3, 6, 10, 13, 16, 25, 32, 39, 51, 73, 97, 140, 175, 216, 258, 302, 347, 394, 471, 541, 644, 738, 861], // Amps
        three_phase: [3, 6, 10, 0, 16, 20, 25, 34, 47, 63, 83, 102, 124, 158, 192, 222, 255, 291, 343, 394, 0, 0, 0] // Amps
      },
      {
        method_key: 'method-b',
        method_letter: 'B',
        method_name: 'Enclosed in conduit on a wall or in trunking',
        single_phase: [3, 6, 10, 13, 16, 25, 32, 39, 51, 73, 97, 140, 175, 216, 258, 302, 347, 394, 471, 541, 644, 738, 861], // Amps
        three_phase: [3, 6, 10, 0, 16, 20, 25, 34, 47, 63, 83, 102, 124, 158, 192, 222, 255, 291, 343, 394, 0, 0, 0] // Amps
      },
      {
        method_key: 'method-c',
        method_letter: 'C',
        method_name: 'Clipped direct',
        single_phase: [3, 6, 10, 13, 16, 25, 32, 39, 51, 73, 97, 140, 175, 216, 258, 302, 347, 394, 471, 541, 644, 738, 861], // Amps
        three_phase: [3, 6, 10, 0, 16, 20, 25, 34, 47, 63, 83, 102, 124, 158, 192, 222, 255, 291, 343, 394, 0, 0, 0] // Amps
      },
      {
        method_key: 'method-d',
        method_letter: 'D',
        method_name: 'Direct in ground or in ducting in ground',
        single_phase: [3, 6, 10, 13, 16, 25, 32, 39, 51, 73, 97, 140, 175, 216, 258, 302, 347, 394, 471, 541, 644, 738, 861], // Amps
        three_phase: [3, 6, 10, 0, 16, 20, 25, 34, 47, 63, 83, 102, 124, 158, 192, 222, 255, 291, 343, 394, 0, 0, 0] // Amps
      },
      {
        method_key: 'method-e',
        method_letter: 'E',
        method_name: 'In free air or on a perforated cable tray',
        single_phase: [3, 6, 10, 13, 16, 25, 32, 39, 51, 73, 97, 140, 175, 216, 258, 302, 347, 394, 471, 541, 644, 738, 861], // Amps
        three_phase: [3, 6, 10, 0, 16, 20, 25, 34, 47, 63, 83, 102, 124, 158, 192, 222, 255, 291, 343, 394, 0, 0, 0] // Amps
      },
    ],
    voltage_drop:
    {
      single_phase: [93, 62, 46, 37, 32, 19, 12, 7.8, 4.6, 2.9, 1.8, 1.32, 0.93, 0.67, 0.53, 0.43, 0.36, 0.32, 0.27, 0.24, 0.21, 0.2, 0.185], // (mV/A/m)
      three_phase: [80, 54, 40, 0, 27, 16, 10, 6.7, 4, 2.5, 1.55, 1.15, 0.84, 0.58, 0.44, 0.36, 0.3, 0.26, 0.21, 0.185, 0, 0, 0] // (mV/A/m)
    }
  }
];

// Logic determining cable size
async function calculateCableSize(phase, inputVoltageDrop, power, lengthCable, inputMethod) {
  const results = []

  TABLES.forEach(({ method_installation, voltage_drop, title, sub_title, short_title, conductor_cross_sectional_area }) => {
    const methodInstallation = method_installation
      .find((method) => method.method_key === inputMethod)

    if (!methodInstallation) {
      const resultInstallationNotFound = {
        title,
        sub_title,
        short_title,
        message: 'The installation method which you have selected does not appear in this cables current carrying capacity table. Please select an alternative installation method or seek further assistance.'
      }

      results.push(resultInstallationNotFound)

      return
    }

    const phaseCapacity = methodInstallation[phase]


    const voltageDropBaseOnPhase = phase === 'single_phase' ? 230 : 400
    const voltageDropPercentage = inputVoltageDrop === 3 ? (3 / 100) : (5 / 100)
    let maximumVoltageDrop = Number((voltageDropBaseOnPhase * voltageDropPercentage).toFixed(2))

    let appropriateCableSize, lastCapacityReached = false

    for (let i = 0; i < phaseCapacity.length; i++) {
      if (power <= phaseCapacity[i] && !lastCapacityReached) {
        lastCapacityReached = true
      }

      let voltageDropped = ((lengthCable * power * voltage_drop[phase][i]) / 1000)

      if (voltageDropped <= maximumVoltageDrop && lastCapacityReached) {
        appropriateCableSize = conductor_cross_sectional_area[i]
        break
      }
    }

    if (appropriateCableSize) {
      const result = {
        title,
        sub_title,
        shortTitle: short_title,
        cableSize: appropriateCableSize,
        methodInstallation: methodInstallation.method_name,
        voltage: voltageDropBaseOnPhase
      }

      results.push(result)
    } else {
      const resultIncalculable = {
        message: 'We were unable to calculate a recommended cable size for this application. Please check that your requirements are correct and try again',
        title,
        sub_title,
        short_title,
      }

      results.push(resultIncalculable)
    }
  })

  return results
}

