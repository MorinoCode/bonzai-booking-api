import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "eu-north-1" });

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

export const getAllBookings = async () => {
  try {
    const command = new ScanCommand({
      TableName: BOOKINGS_TABLE,
    });

    const result = await client.send(command);

    const bookings = result.Items.map((item) => ({
      bookingId: item.SK.S.replace("BOOKING#", ""),
      guestName: item.guestName.S,
      guestEmail: item.PK.S.replace("USER#", ""),
      checkInDate: item.checkInDate.S,
      checkOutDate: item.checkOutDate.S,
      guests: Number(item.guests.N),
      rooms: JSON.parse(item.rooms.S),
      totalPrice: Number(item.totalPrice.N),
      status: item.status.S,
      createdAt: item.createdAt.S,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(bookings),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
