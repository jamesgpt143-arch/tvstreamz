const startStr = "20260427000000 +0000";

const parseXMLTVTime = (str) => {
  // Format: YYYYMMDDHHMMSS +HHMM
  const match = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s?([+-]\d{4})?$/);
  if (!match) return null;
  const [_, y, m, d, h, min, s, offset] = match;
  
  // Construct ISO string for parsing
  let iso = `${y}-${m}-${d}T${h}:${min}:${s}`;
  if (offset) {
    iso += offset.substring(0, 3) + ':' + offset.substring(3);
  } else {
    iso += 'Z';
  }
  return new Date(iso);
};

const date = parseXMLTVTime(startStr);
console.log(date.toISOString());
