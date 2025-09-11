import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { validateRoomsMatchGuests } from "../validators/rooms.mjs";
import { nightsBetween } from "../utils/dates.mjs";
import { calculateTotalPrice } from "../utils/pricing.mjs";

const client = new DynamoDBClient({ region: "eu-north-1" });
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;


// example request :
// {
  
//   "checkInDate": "2025-10-20",
//   "checkOutDate": "2025-11-23",
//   "guests": 3,
//   "rooms": [
//     {"type": "double", "count": 1},
//     ]
// }

export const updateBooking = async (event) => {
  try {
    const { bookingId, guestEmail } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { guests, rooms, checkInDate, checkOutDate } = body;

    if (!bookingId || !guestEmail) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing bookingId or guestEmail" }) };
    }

    
    const getCommand = new GetItemCommand({
      TableName: BOOKINGS_TABLE,
      Key: {
        PK: { S: `GUEST#${guestEmail}` },
        SK: { S: `BOOKING#${bookingId}` },
      },
    });
    const getResult = await client.send(getCommand);
    if (!getResult.Item) {
      return { statusCode: 404, body: JSON.stringify({ message: "Booking not found" }) };
    }

   
    if (guests && rooms) {
      if (!validateRoomsMatchGuests(rooms, guests)) {
        return { statusCode: 400, body: JSON.stringify({ message: "Rooms do not match number of guests" }) };
      }
    }

    
    const startDate = checkInDate || getResult.Item.checkInDate.S;
    const endDate = checkOutDate || getResult.Item.checkOutDate.S;
    const nights = nightsBetween(startDate, endDate);
    if (nights <= 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "Invalid dates" }) };
    }

    const totalPrice = calculateTotalPrice(rooms || JSON.parse(getResult.Item.rooms.S), nights);

    
    const updateCommand = new UpdateItemCommand({
  TableName: BOOKINGS_TABLE,
  Key: {
    PK: { S: `GUEST#${guestEmail}` },
    SK: { S: `BOOKING#${bookingId}` },
  },
  UpdateExpression: `SET 
    guests = :guests,
    rooms = :rooms,
    checkInDate = :checkInDate,
    checkOutDate = :checkOutDate,
    totalPrice = :totalPrice,
    modifiedAt = :modifiedAt`,  
  ExpressionAttributeValues: {
    ":guests": { N: (guests || Number(getResult.Item.guests.N)).toString() },
    ":rooms": { S: JSON.stringify(rooms || JSON.parse(getResult.Item.rooms.S)) },
    ":checkInDate": { S: startDate },
    ":checkOutDate": { S: endDate },
    ":totalPrice": { N: totalPrice.toString() },
    ":modifiedAt": { S: new Date().toISOString() },
  },
  ReturnValues: "ALL_NEW",
});

    const updateResult = await client.send(updateCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Booking updated successfully", booking: updateResult.Attributes }),
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
