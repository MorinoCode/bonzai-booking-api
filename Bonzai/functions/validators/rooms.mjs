export const CAPACITY = { single: 1, double: 2, suite: 3 };

export function validateRoomsMatchGuests(rooms, guests) {
  let totalCapacity = 0;

  for (const room of rooms) {
    if (!CAPACITY[room.type] || room.count <= 0) return false;
    totalCapacity += CAPACITY[room.type] * room.count;
  }
  return totalCapacity === guests;
}
