// Aegis Hybrid Server: REST API + WebSocket for real-time updates
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import { RFQService } from './services/rfq.js';

// Load .env from the server directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Configuration from environment
const config = {
  port: parseInt(process.env.PORT || '3001'),
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  nodeUrl: process.env.MIDNIGHT_NODE_URL || 'http://localhost:9944',
  indexerUrl: process.env.MIDNIGHT_INDEXER_URL || 'http://localhost:8088/api/v3/graphql',
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
  mode: process.env.MODE || 'mock', // 'mock' or 'contract'
};

// Fix BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const rfqService = new RFQService();

app.use(cors());
app.use(express.json());

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// WebSocket server for real-time order book updates
const wss = new WebSocketServer({ server });

// Track connected WebSocket clients
const wsClients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  wsClients.add(ws);
  console.log(`🤝 WebSocket client connected (${wsClients.size} total)`);

  // Send initial order book to new client
  const orderBook = rfqService.getAllOrders();
  ws.send(JSON.stringify({
    type: 'orderBook',
    data: orderBook
  }));

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`👋 WebSocket client disconnected (${wsClients.size} remaining)`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// Broadcast helper - sends message to all connected WebSocket clients
function broadcastToAll(message: any) {
  const payload = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// POST /rfq - Submit a Request for Quote
app.post('/rfq', (req, res) => {
  try {
    console.log('📝 RFQ Request:', req.body);
    const quote = rfqService.submitRfq(req.body);
    
    // Broadcast new order to all WebSocket clients
    broadcastToAll({
      type: 'orderBook',
      data: rfqService.getAllOrders()
    });

    res.json(quote);
  } catch (error: any) {
    console.error('❌ RFQ Error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// GET /orders - Get orders for a specific wallet
app.get('/orders', (req, res) => {
  try {
    const wallet = req.query.wallet as string;
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    console.log(`📊 Fetching orders for wallet: ${wallet}`);
    const orders = rfqService.getUserOrders(wallet);
    res.json(orders);
  } catch (error: any) {
    console.error('❌ Get Orders Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /orders/:orderId - Get a specific order by ID
app.get('/orders/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = rfqService.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error: any) {
    console.error('❌ Get Order Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /orders/:orderId/fill - Mark an order as filled
app.post('/orders/:orderId/fill', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = rfqService.markOrderFilled(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ Order filled: ${orderId}`);
    
    // Broadcast order book update to all WebSocket clients
    broadcastToAll({
      type: 'orderFilled',
      data: order
    });
    
    broadcastToAll({
      type: 'orderBook',
      data: rfqService.getAllOrders()
    });

    res.json(order);
  } catch (error: any) {
    console.error('❌ Fill Order Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /health - Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    wsConnections: wsClients.size,
    totalOrders: rfqService.getAllOrders().length,
    mode: config.mode,
    contractAddress: config.contractAddress || 'not configured',
  });
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(config.port, () => {
  console.log('🚀 Aegis Hybrid Server');
  console.log(`   Mode:      ${config.mode}`);
  console.log(`   Contract:  ${config.contractAddress || 'not configured'}`);
  console.log(`   REST API:  http://localhost:${config.port}`);
  console.log(`   WebSocket: ws://localhost:${config.port}`);
  console.log(`   Health:    http://localhost:${config.port}/health`);
});