const PRICE = { single: 500, double: 1000, suite: 1500 };

export function calculateTotalPrice(rooms, nights) {
  let perNight = 0;
  for (const r of rooms) {
    perNight += PRICE[r.type] * r.count;
  }
  return perNight * nights;
}
