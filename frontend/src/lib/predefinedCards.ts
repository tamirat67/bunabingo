// Predefined Bingo Cards 1-100
export const PREDEFINED_CARDS: Record<number, number[][]> = {
  1: [[1, 16, 31, 46, 61], [2, 17, 32, 47, 62], [3, 18, 0, 48, 63], [4, 19, 34, 49, 64], [5, 20, 35, 50, 65]],
  2: [[10, 25, 40, 55, 70], [11, 26, 41, 56, 71], [12, 27, 0, 57, 72], [13, 28, 43, 58, 73], [14, 29, 44, 59, 74]],
  // ... adding more as needed or filling with sample logic for now
};

// Fill the rest up to 100 with generated logic
for (let i = 3; i <= 100; i++) {
  const card: number[][] = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) row.push(0); // Free space
      else {
        const min = c * 15 + 1;
        const max = (c + 1) * 15;
        row.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
    }
    card.push(row);
  }
  PREDEFINED_CARDS[i] = card;
}
