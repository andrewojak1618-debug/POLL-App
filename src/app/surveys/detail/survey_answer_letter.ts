/**
 * Creates spreadsheet-style answer letters, continuing with AA after Z.
 * @param index - Zero-based answer position.
 * @returns The visible answer label.
 */
export function surveyAnswerLetter(index: number): string {
  const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let label: string = '';
  for (let position: number = index + 1; position > 0; position = Math.floor((position - 1) / alphabet.length)) {
    label = alphabet[(position - 1) % alphabet.length] + label;
  }
  return label;
}
