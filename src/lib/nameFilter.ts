const BLOCKED_WORDS: readonly string[] = [
  // Bahasa Indonesia (kata kasar / umpatan umum)
  'anjing',
  'anjir',
  'anjay',
  'asu',
  'babi',
  'bajingan',
  'bangsat',
  'bgst',
  'bego',
  'bodoh',
  'brengsek',
  'bacot',
  'cibai',
  'cok',
  'dancok',
  'goblok',
  'goblog',
  'idiot',
  'jancok',
  'jancuk',
  'kampret',
  'keparat',
  'kimak',
  'kontol',
  'kntl',
  'kunyuk',
  'lonte',
  'memek',
  'mmk',
  'monyet',
  'ngentot',
  'ngentod',
  'ngtd',
  'pantek',
  'perek',
  'pukimak',
  'setan',
  'sialan',
  'sinting',
  'tai',
  'taik',
  'tolol',
  'tll',
  // Bahasa Inggris (profanity umum)
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'cunt',
  'dick',
  'fuck',
  'fck',
  'fucker',
  'fucking',
  'motherfucker',
  'nigga',
  'nigger',
  'pussy',
  'shit',
  'slut',
  'whore',
];

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  $: 's',
  '7': 't',
};

function normalizeToken(raw: string): string {
  const lower = raw.toLowerCase();
  let mapped = '';
  for (const ch of lower) {
    mapped += LEET_MAP[ch] ?? ch;
  }
  const lettersOnly = mapped.replace(/[^a-z]/g, '');
  // Ciutkan huruf berulang lebih dari 1 kali (misal: "anjiiing" -> "anjing")
  return lettersOnly.replace(/(.)\1+/g, '$1');
}

const NORMALIZED_BLOCKLIST = new Set(BLOCKED_WORDS.map(normalizeToken));
const LONG_BLOCKLIST = BLOCKED_WORDS.map(normalizeToken).filter((w) => w.length >= 4);

/**
 * Memeriksa apakah teks mengandung kata kasar atau tidak pantas,
 * termasuk variasi angka/simbol (leetspeak) dan pemisahan spasi.
 */
export function containsInappropriateWord(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') return false;

  // 1. Cek per kata
  const tokens = trimmed.split(/[\s,._\-/]+/).filter(Boolean);
  for (const token of tokens) {
    const normalized = normalizeToken(token);
    if (normalized !== '' && NORMALIZED_BLOCKLIST.has(normalized)) {
      return true;
    }
  }

  // 2. Cek upaya penyamaran dengan spasi antar huruf tunggal (misal: "a n j i n g")
  const singleCharRun = tokens.length >= 3 && tokens.every((t) => t.length <= 2);
  if (singleCharRun) {
    const joined = normalizeToken(tokens.join(''));
    if (NORMALIZED_BLOCKLIST.has(joined)) return true;
    for (const bad of LONG_BLOCKLIST) {
      if (joined.includes(bad)) return true;
    }
  }

  return false;
}

export interface NameValidationOptions {
  fieldLabel?: string;
  required?: boolean;
  maxLength?: number;
}

/**
 * Memvalidasi nama tamu atau nama tab baru.
 * Mengembalikan pesan error yang jelas jika tidak valid, atau `null` jika lolos.
 */
export function validateDisplayName(
  value: string,
  options: NameValidationOptions = {},
): string | null {
  const { fieldLabel = 'Nama', required = false, maxLength = 40 } = options;
  const clean = value.trim();

  if (required && clean === '') {
    return `${fieldLabel} wajib diisi.`;
  }
  if (clean.length > maxLength) {
    return `${fieldLabel} maksimal ${maxLength} karakter.`;
  }
  if (containsInappropriateWord(clean)) {
    return `${fieldLabel} mengandung kata yang tidak pantas, silakan gunakan kata yang sopan.`;
  }
  return null;
}
