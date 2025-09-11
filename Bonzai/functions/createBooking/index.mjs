import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { validateRoomsMatchGuests } from "../validators/rooms.mjs";
import { calculateTotalPrice } from "../utils/pricing.mjs";
import { nightsBetween } from "../utils/dates.mjs";


// request example : 
// {
//   "guestName": "Mandus",
//   "guestEmail": "Mandus@example.com",
//   "checkInDate": "2025-09-20",
//   "checkOutDate": "2025-09-23",
//   "guests": 3,
//   "rooms": [
//     {"type": "double", "count": 1},
//     {"type": "single", "count": 1}
//   ]
// }


const client = new DynamoDBClient({ region: "eu-north-1" });
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

export const createBooking = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { guestName, guestEmail, checkInDate, checkOutDate, guests, rooms } = body;

    // ولیدیشن ساده
    if (!guestName || !guestEmail || !checkInDate || !checkOutDate || !guests || !rooms) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
    }

    if (!validateRoomsMatchGuests(rooms, guests)) {
      return { statusCode: 400, body: JSON.stringify({ message: "Rooms do not match number of guests" }) };
    }

    const nights = nightsBetween(checkInDate, checkOutDate);
    if (nights <= 0) return { statusCode: 400, body: JSON.stringify({ message: "Invalid dates" }) };

    const totalPrice = calculateTotalPrice(rooms, nights);
    const bookingId = uuidv4();

    // ساخت آیتم با PK و SK
    const item = {
      PK: { S: `GUEST#${guestEmail}` },        // Partition Key برای کاربر
      SK: { S: `BOOKING#${bookingId}` },     // Sort Key برای هر رزرو
      bookingId: { S: bookingId },
      guestName: { S: guestName },
      guestEmail: { S: guestEmail },
      checkInDate: { S: checkInDate },
      checkOutDate: { S: checkOutDate },
      guests: { N: guests.toString() },
      rooms: { S: JSON.stringify(rooms) },
      totalPrice: { N: totalPrice.toString() },
      status: { S: "CONFIRMED" },
      createdAt: { S: new Date().toISOString() },
    };

    const command = new PutItemCommand({
      TableName: BOOKINGS_TABLE,
      Item: item,
    });

    await client.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify({
        ...body,
        bookingId,
        totalPrice,
        status: "CONFIRMED",
        createdAt: item.createdAt.S
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
