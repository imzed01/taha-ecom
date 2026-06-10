import { NextResponse } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";

export type NextApiResponseServerIO = NextResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export async function GET() {
  console.log("Socket API route called - GET");

  // For GET requests, just return a status message
  return NextResponse.json({ message: "Socket server is running" });
}

export async function POST() {
  console.log("Socket API route called - POST");

  // For POST requests, handle socket initialization
  // Note: Socket.IO setup is typically done in a separate handler
  // This is just a placeholder for the API route structure

  return NextResponse.json({ message: "Socket server endpoint" });
}
