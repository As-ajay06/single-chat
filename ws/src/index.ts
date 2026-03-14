import 'dotenv/config';
import { type JwtPayload } from "jsonwebtoken";
import * as jwt from "jsonwebtoken"
import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port : Number(process.env.PORT)});
console.log(process.env.PORT)


interface User {
  socket: WebSocket,
  rooms: string[],
  userId: string

}

interface ParsedMessage {
  type: "JOIN" | "CHAT" | "LEAVE",
  roomId: string,
  payload: string
}

function getUserId(urlParam: URLSearchParams) {
  let userId;
  if (urlParam) {
    const token = urlParam.get("token");
    // if (!token) return;
    // const decode = jwt.verify(token, "THIS_IS_SECTRET") as JwtPayload;
    // try {
    //   if (!decode) {
    //     console.log("not a jwt payload")
    //   }
    // } catch (err) {
    //   throw err;
    // }

    // // get the user ID 
    // userId = decode.userId;
    if (token) {
      userId = token;
    } else {
      console.log("Not a connection")
      wss.close()
    }

  }
  return userId;
}

let users: User[] = [];

wss.on("connection", async (socket, request) => {

  const url = new URL(request.url!, `${process.env.BASE_URL}`)
  const urlParam = url.searchParams;
  const userId = getUserId(urlParam);
  // checked above.
  let rooms: string[] = []
  if (userId) {
    users.push({ userId, socket, rooms });
    // checked above.
  }
  else {
    console.log("Not found USER ID")
    wss.close();
  }

  socket.on("close", () => {
    users = users.filter(user => user.socket !== socket)
  })

  socket.on("message", async (message) => {
    try {
      const parsedMessage: ParsedMessage = JSON.parse(message.toString());

      // parsedMessage = { type: "JOIN" , roomId :"something.", userId : ""}
      if (parsedMessage.type === "JOIN") {
        // get the user from the users.
        try {
          const foundUser = users.find((user) => user.socket == socket);
          console.log(foundUser);
          if (!foundUser) {
            socket.send("User not found");
            return;
          }
          foundUser.rooms.push(parsedMessage.roomId);
          socket.send(`You can now send message to roomId ${parsedMessage.roomId}`);
        } catch (err) {
          console.log("Error", err);
        }
      }

      // logic for chating.

      if (parsedMessage.type === "CHAT") {
        try {
          const sender = users.find((user) => user.socket === socket);
          const senderId = sender ? sender.userId : "unknown";
          users.forEach((user) => {
            if (user.rooms.includes(parsedMessage.roomId)) {
              user.socket.send(JSON.stringify({
                type: "CHAT",
                roomId: parsedMessage.roomId,
                userId: senderId,
                message: parsedMessage.payload,
                timestamp: Date.now()
              }))
            }
          })
        } catch (err) {
          console.log("something happened while sending message", err);
        }
      }

      // for leaving the room or rooms

      if (parsedMessage.type === "LEAVE") {
        try {
          const foundUser = users.find((user) => user.socket == socket);
          if (foundUser) {
            foundUser.rooms = foundUser.rooms.filter(
              (room) => room !== parsedMessage.roomId
            );
          }
        } catch (err) {
          console.log("Something happened during leave.", err);
        }
      }

    } catch (err) {
      console.log("error found :", err);
    }


  })


});


