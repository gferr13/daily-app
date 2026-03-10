const PEAKS = {
  restaurants:  { weekday: [[12,14],[18,21]], weekend: [[11,15],[17,22]] },
  cafes:        { weekday: [[7,10],[12,14]], weekend: [[9,13]] },
  bars:         { weekday: [[18,23]], weekend: [[20,24],[0,2]] },
  pizza:        { weekday: [[12,14],[18,22]], weekend: [[11,15],[17,23]] },
  fastfood:     { weekday: [[12,14],[18,20]], weekend: [[12,20]] },
  bakeries:     { weekday: [[7,10],[12,14]], weekend: [[9,12]] },
  dessert:      { weekday: [[14,17],[20,22]], weekend: [[13,22]] },
  familyfun:    { weekday: [[15,19]], weekend: [[11,18]] },
  dispensary:   { weekday: [[16,20]], weekend: [[14,21]] },
  grocery:      { weekday: [[17,20]], weekend: [[10,14]] },
  sushi:        { weekday: [[12,14],[18,21]], weekend: [[12,22]] },
  mexican:      { weekday: [[12,14],[18,21]], weekend: [[12,22]] },
  italian:      { weekday: [[18,22]], weekend: [[17,22]] },
  chinese:      { weekday: [[12,14],[18,21]], weekend: [[12,22]] },
  indian:       { weekday: [[12,14],[18,22]], weekend: [[12,22]] },
  brunch:       { weekday: [[9,12]], weekend: [[9,14]] },
  gas:          { weekday: [[7,9],[17,19]], weekend: [[10,14]] },
};

export function isBusy(categoryId) {
  const now = new Date();
  const hour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const pattern = PEAKS[categoryId];
  if (!pattern) return false;
  const windows = isWeekend ? pattern.weekend : pattern.weekday;
  return windows.some(([start, end]) => hour >= start && hour < end);
}
