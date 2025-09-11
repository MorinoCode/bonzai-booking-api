import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "eu-north-1" });
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

export const getBookingsByGuest = async (event) => {
  try {
    
    const guestEmail = event.pathParameters?.guestEmail;
    if (!guestEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing guestEmail path parameter" }),
      };
    }

    const command = new QueryCommand({
      TableName: BOOKINGS_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: `GUEST#${guestEmail}` },
      },
      ScanIndexForward: false,
    });

    const result = await client.send(command);

    const bookings = result.Items.map((item) => ({
      bookingId: item.SK.S.replace("BOOKING#", ""),
      guestName: item.guestName.S,
      guestEmail: item.PK.S.replace("GUEST#", ""),
      checkInDate: item.checkInDate.S,
      checkOutDate: item.checkOutDate.S,
      guests: Number(item.guests.N),
      rooms: JSON.parse(item.rooms.S),
      totalPrice: Number(item.totalPrice.N),
      status: item.status.S,
      createdAt: item.createdAt.S,
    }));

    return { statusCode: 200, body: JSON.stringify(bookings) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
