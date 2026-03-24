/* ── Data ──────────────────────────────────────────────────── */
const CATEGORIES = {
  weight: {
    units: [
      { id: 'kg',  label: 'Kilogram (kg)' },
      { id: 'g',   label: 'Gram (g)' },
      { id: 'mg',  label: 'Milligram (mg)' },
      { id: 'lb',  label: 'Pound (lb)' },
      { id: 'oz',  label: 'Ounce (oz)' },
      { id: 'ton', label: 'Metric Ton (t)' },
      { id: 'st',  label: 'Stone (st)' },
    ],
    // All values relative to 1 kg (base unit)
    toBase: {
      kg: 1,
      g: 0.001,
      mg: 0.000001,
      lb: 0.45359237,
      oz: 0.0283495,
      ton: 1000,
      st: 6.35029,
    },
    quickRef: [
      { v: 1,   f: 'kg', t: 'lb', label: '1 kg → lb'   },
      { v: 1,   f: 'lb', t: 'kg', label: '1 lb → kg'   },
      { v: 1,   f: 'oz', t: 'g',  label: '1 oz → g'    },
      { v: 1,   f: 'st', t: 'kg', label: '1 st → kg'   },
      { v: 100, f: 'g',  t: 'oz', label: '100 g → oz'  },
    ],
  },

  length: {
    units: [
      { id: 'm',   label: 'Meter (m)' },
      { id: 'km',  label: 'Kilometer (km)' },
      { id: 'cm',  label: 'Centimeter (cm)' },
      { id: 'mm',  label: 'Millimeter (mm)' },
      { id: 'mi',  label: 'Mile (mi)' },
      { id: 'yd',  label: 'Yard (yd)' },
      { id: 'ft',  label: 'Foot (ft)' },
      { id: 'in',  label: 'Inch (in)' },
      { id: 'nmi', label: 'Nautical Mile (nmi)' },
    ],
    // All values relative to 1 meter (base unit)
    toBase: {
      m: 1,
      km: 1000,
      cm: 0.01,
      mm: 0.001,
      mi: 1609.344,
      yd: 0.9144,
      ft: 0.3048,
      in: 0.0254,
      nmi: 1852,
    },
    quickRef: [
      { v: 1,   f: 'mi', t: 'km', label: '1 mi → km'   },
      { v: 1,   f: 'km', t: 'mi', label: '1 km → mi'   },
      { v: 1,   f: 'ft', t: 'm',  label: '1 ft → m'    },
      { v: 100, f: 'm',  t: 'ft', label: '100 m → ft'  },
      { v: 1,   f: 'in', t: 'cm', label: '1 in → cm'   },
    ],
  },

  temperature: {
    units: [
      { id: 'c', label: 'Celsius (°C)' },
      { id: 'f', label: 'Fahrenheit (°F)' },
      { id: 'k', label: 'Kelvin (K)' },
      { id: 'r', label: 'Rankine (°R)' },
    ],
    quickRef: [
      { v: 0,   f: 'c', t: 'f', label: '0°C → °F'    },
      { v: 100, f: 'c', t: 'f', label: '100°C → °F'  },
      { v: 32,  f: 'f', t: 'c', label: '32°F → °C'   },
      { v: 0,   f: 'c', t: 'k', label: '0°C → K'     },
      { v: 300, f: 'k', t: 'c', label: '300K → °C'   },
    ],
  },
};

let currentCat = 'weight';

/* ── Temperature Conversion ────────────────────────────────── */
/**
 * Converts a temperature value between units.
 * Strategy: convert input → Celsius first, then Celsius → target unit.
 * @param {number} value
 * @param {'c'|'f'|'k'|'r'} from
 * @param {'c'|'f'|'k'|'r'} to
 * @returns {number}
 */
function convertTemp(value, from, to) {
  let celsius;

  switch (from) {
    case 'c': celsius = value; break;
    case 'f': celsius = (value - 32) * 5 / 9; break;
    case 'k': celsius = value - 273.15; break;
    case 'r': celsius = (value - 491.67) * 5 / 9; break;
  }

  switch (to) {
    case 'c': return celsius;
    case 'f': return celsius * 9 / 5 + 32;
    case 'k': return celsius + 273.15;
    case 'r': return (celsius + 273.15) * 9 / 5;
  }
}

/* ── UI Helpers ────────────────────────────────────────────── */

/** Switch the active category tab and reset the UI. */
function switchCategory(cat) {
  currentCat = cat;

  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.cat === cat)
  );

  populateSelects();
  clearResult();
  document.getElementById('fromValue').value = '';
  updateQuickRef();
}

/** Populate the From and To <select> dropdowns for the current category. */
function populateSelects() {
  const cat = CATEGORIES[currentCat];
  const fromSel = document.getElementById('fromUnit');
  const toSel = document.getElementById('toUnit');

  fromSel.innerHTML = '';
  toSel.innerHTML = '';

  cat.units.forEach(u => {
    fromSel.add(new Option(u.label, u.id));
    toSel.add(new Option(u.label, u.id));
  });

  // Default: select second unit in "To" so they differ
  toSel.selectedIndex = 1;
}

/** Swap the From and To unit selectors. */
function swapUnits() {
  const fromSel = document.getElementById('fromUnit');
  const toSel = document.getElementById('toUnit');
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  updateQuickRef();
  clearResult();
}

/** Hide the result panel and clear any error message. */
function clearResult() {
  document.getElementById('resultPanel').classList.remove('visible');
  document.getElementById('errorMsg').textContent = '';
}

/** Return the human-readable label for a unit ID in the current category. */
function getUnitLabel(id) {
  const cat = CATEGORIES[currentCat];
  return cat.units.find(u => u.id === id)?.label || id;
}

/**
 * Format a number for display.
 * Very small values use exponential notation; others use up to 8 significant digits.
 * @param {number} n
 * @returns {string}
 */
function formatNumber(n) {
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(6);
  return parseFloat(n.toPrecision(8)).toString();
}

/* ── Core Convert ──────────────────────────────────────────── */
/**
 * Perform the conversion and update the result panel.
 * When called from a quick-ref chip, prefill arguments override the inputs.
 * @param {string} [prefillFrom] - unit ID to convert from (quick-ref only)
 * @param {string} [prefillTo]   - unit ID to convert to   (quick-ref only)
 * @param {number} [prefillVal]  - value to convert         (quick-ref only)
 */
function convert(prefillFrom, prefillTo, prefillVal) {
  const fromVal = prefillVal !== undefined
    ? prefillVal
    : parseFloat(document.getElementById('fromValue').value);

  const fromUnit = prefillFrom || document.getElementById('fromUnit').value;
  const toUnit   = prefillTo   || document.getElementById('toUnit').value;
  const errEl    = document.getElementById('errorMsg');

  errEl.textContent = '';

  if (isNaN(fromVal)) {
    errEl.textContent = '⚠ Please enter a valid number.';
    return;
  }

  // Calculate result
  let result;
  if (currentCat === 'temperature') {
    result = convertTemp(fromVal, fromUnit, toUnit);
  } else {
    const tb = CATEGORIES[currentCat].toBase;
    result = fromVal * tb[fromUnit] / tb[toUnit];
  }

  // If triggered by a quick-ref chip, also update the input fields
  if (prefillFrom !== undefined) {
    document.getElementById('fromValue').value = prefillVal;
    document.getElementById('fromUnit').value  = fromUnit;
    document.getElementById('toUnit').value    = toUnit;
  }

  // Display result
  const panel = document.getElementById('resultPanel');
  document.getElementById('resultValue').textContent = formatNumber(result);
  document.getElementById('resultUnit').textContent  =
    `${fromVal} ${getUnitLabel(fromUnit)}  =  ${formatNumber(result)} ${getUnitLabel(toUnit)}`;
  panel.classList.add('visible');

  // Store raw value for copy button
  panel.dataset.raw = formatNumber(result);
}

/** Copy the current result value to the clipboard. */
function copyResult() {
  const raw = document.getElementById('resultPanel').dataset.raw;
  if (!raw) return;

  navigator.clipboard.writeText(raw).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'COPIED!';
    setTimeout(() => (btn.textContent = 'COPY'), 1500);
  });
}

/* ── Quick Reference Chips ─────────────────────────────────── */
/** Rebuild the quick-conversion chips for the current category. */
function updateQuickRef() {
  const cat = CATEGORIES[currentCat];
  const container = document.getElementById('refChips');
  container.innerHTML = '';

  cat.quickRef.forEach(ref => {
    const chip = document.createElement('button');
    chip.className = 'ref-chip';
    chip.textContent = ref.label;
    chip.onclick = () => convert(ref.f, ref.t, ref.v);
    container.appendChild(chip);
  });
}

/* ── Initialise ────────────────────────────────────────────── */
populateSelects();
updateQuickRef();

// Allow pressing Enter in the number input to trigger conversion
document.getElementById('fromValue').addEventListener('keydown', e => {
  if (e.key === 'Enter') convert();
});
