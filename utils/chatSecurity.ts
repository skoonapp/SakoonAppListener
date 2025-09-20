// This file centralizes the logic for chat security and content moderation.

// A comprehensive list of forbidden words in Hindi, Hinglish, and English.
// The \b metacharacter ensures we match whole words only to avoid false positives.
const FORBIDDEN_WORDS_LIST = [
  // Hindi / Hinglish Abusive
  'madarchod', 'behenchod', 'bhenchod', 'bhosdike', 'bhosda', 'bsdk', 'mc', 'bc',
  'chutiya', 'gaandu', 'gandu', 'randi', 'kutta', 'kamina', 'haramzade', 'suar',
  'gali', 'galoj', 'chutiye', 'madar', 'chod',

  // Sexual / Inappropriate
  'sex', 'sexual', 'porn', 'nude', 'naked', 'chut', 'lund', 'gaand', 'boobs',
  'chuchi', 'chuchiya', 'threesome', 'orgasm', 'vibrator', 'horny', 'sexy'
];

// --- REGULAR EXPRESSIONS ---

// 1. Pattern for just the abusive/sexual words from the list above.
// Used to filter incoming messages for display.
const FORBIDDEN_WORDS_SOURCE = `\\b(${FORBIDDEN_WORDS_LIST.join('|')})\\b`;
export const FORBIDDEN_WORDS_PATTERN = new RegExp(FORBIDDEN_WORDS_SOURCE, 'gi');

// 2. Pattern for URLs.
const URL_SOURCE = `(?:(?:https?|ftp):\\/\\/|www\\.|[a-z0-9.-]+\\.(?:com|org|net|in|co|io))\\S*`;

// 3. Pattern for phone numbers (7 or more consecutive digits).
const PHONE_NUMBER_SOURCE = `\\b\\d{7,}\\b`;

// 4. Combined pattern for listener's outgoing message validation.
// This blocks URLs, phone numbers, AND forbidden words from being sent.
export const FORBIDDEN_CONTENT_PATTERN = new RegExp(
  `(${URL_SOURCE})|(${PHONE_NUMBER_SOURCE})|(${FORBIDDEN_WORDS_SOURCE})`,
  'gi'
);


// --- FUNCTIONS ---

/**
 * Filters incoming message text to hide inappropriate words from the listener.
 * Replaces words from the forbidden list with asterisks.
 * @param text The original message text.
 * @returns The sanitized message text.
 */
export const filterInappropriateContent = (text: string): string => {
  if (!text) return '';
  return text.replace(FORBIDDEN_WORDS_PATTERN, (match) => '*'.repeat(match.length));
};
