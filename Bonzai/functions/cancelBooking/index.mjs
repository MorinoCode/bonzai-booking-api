import { DynamoDBClient, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "eu-north-1" });
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;


const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const cancelBooking = async (event) => {
  try {
    const { bookingId, guestEmail } = event.pathParameters;

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

    const checkInDate = new Date(getResult.Item.checkInDate.S);
    const now = new Date();

    
    const diffDays = Math.ceil((checkInDate - now) / MS_PER_DAY);
    if (diffDays < 2) {
      return { statusCode: 400, body: JSON.stringify({ message: "Booking cannot be canceled less than 2 days before check-in" }) };
    }

    
    const deleteCommand = new DeleteItemCommand({
      TableName: BOOKINGS_TABLE,
      Key: {
        PK: { S: `GUEST#${guestEmail}` },
        SK: { S: `BOOKING#${bookingId}` },
      },
    });

    await client.send(deleteCommand);

    return { statusCode: 200, body: JSON.stringify({ message: "Booking canceled successfully" }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
