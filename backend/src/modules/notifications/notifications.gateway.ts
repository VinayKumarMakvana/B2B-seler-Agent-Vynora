import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Mobile Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Mobile Client disconnected: ${client.id}`);
  }

  // Called internally by the backend when an approval is needed
  notifyApprovalNeeded(data: any) {
    this.server.emit('APPROVAL_NEEDED', data);
  }

  @SubscribeMessage('CLIENT_VIEWING_PRICING')
  handleViewingPricing(client: Socket, payload: { leadId: string, companyName: string }) {
    console.log(`[BEACON] Client ${payload.companyName} is viewing pricing!`);
    this.server.emit('URGENT_ACTION', {
      title: '🔥 Hot Lead Alert',
      message: `${payload.companyName} is looking at the Pricing section RIGHT NOW. Call them!`,
      leadId: payload.leadId
    });
  }
}
