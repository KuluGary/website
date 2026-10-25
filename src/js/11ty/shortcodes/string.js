const DEFAULT_RULE_CHARACTER = "=";
const RULE_LENGTH = 120;

/**
 * Generates a horizontal rule string.
 *
 * @param {string} [char="="]
 * @returns {string}
 */
export function addRule(char = DEFAULT_RULE_CHARACTER) {
  return char.repeat(RULE_LENGTH);
}
