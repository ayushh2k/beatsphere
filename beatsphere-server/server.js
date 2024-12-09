// server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Kafka, Partitioners } = require('kafkajs');
const dotenv = require('dotenv');
const { PassThrough } = require('stream');
const expressWs = require('express-ws')(express());
const WebSocket = require('ws');

dotenv.config();

const app = expressWs.app;
const clients = new Set();
const wsClients = new Map();
const globalChatClients = new Set();
const port = process.env.PORT || 3000;
const kafkaBrokers = process.env.KAFKA_BROKERS.split(',');

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

const kafka = new Kafka({
  clientId: 'beat-sphere',
  brokers: kafkaBrokers,
});

const sendEventsToAll = (locations) => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(locations));
    }
  });
};

const broadcastGlobalMessage = (message) => {
  globalChatClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

const consumer = kafka.consumer({ groupId: 'location-group' });

let userLocations = [];

const run = async () => {
  try {
    await producer.connect();

    await consumer.connect();
    await consumer.subscribe({ topic: 'user_locations', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const location = JSON.parse(message.value.toString());
        console.log(`Received location: ${JSON.stringify(location)}`);
        
        const existingIndex = userLocations.findIndex(loc => loc.id === location.id);
        if (existingIndex !== -1) {
          userLocations[existingIndex] = location;
        } else {
          userLocations.push(location);
        }
    
        sendEventsToAll(userLocations);
      },
    });
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

run().catch(console.error);

app.get('/api/locations/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const stream = new PassThrough();
  clients.add(stream);

  stream.write(`data: ${JSON.stringify(userLocations)}\n\n`);

  const keepAlive = setInterval(() => {
    stream.write(': keep-alive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(stream);
    stream.end();
  });

  stream.pipe(res);
});

app.post('/api/location', async (req, res) => {
  try {
    const { id, latitude, longitude, imageUrl, name, currentlyPlaying } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).send({ error: 'Invalid or missing user ID' });
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).send({ error: 'Invalid or missing latitude/longitude' });
    }

    const newLocation = {
      id,
      name: name || 'User',
      latitude,
      longitude,
      imageUrl: imageUrl || undefined,
      currentlyPlaying: currentlyPlaying || null,
      lastUpdated: Date.now(),
    };

    await producer.send({
      topic: 'user_locations',
      messages: [
        {
          value: JSON.stringify(newLocation),
        },
      ],
    });

    sendEventsToAll(userLocations);

    res.status(201).send(newLocation);
  } catch (error) {
    console.error('Error sending location to Kafka:', error);
    res.status(500).send({ error: 'Failed to send location data', details: error.message });
  }
});

app.get('/api/locations', (req, res) => {
  res.status(200).send(userLocations);
});

app.get('/api/location/:userId', (req, res) => {
  const userId = req.params.userId;
  const userLocation = userLocations.find(location => location.id === userId);
  if (userLocation) {
    res.status(200).send(userLocation);
  } else {
    res.status(404).send({ error: 'User location not found' });
  }
});

app.delete('/api/location/:userId', async (req, res) => {
  const userId = req.params.userId;
  const index = userLocations.findIndex(location => location.id === userId);
  if (index !== -1) {
    userLocations.splice(index, 1);
    await producer.send({
      topic: 'user_locations_deleted',
      messages: [{ value: userId }],
    });
    res.status(200).send({ message: 'User location deleted' });
  } else {
    res.status(404).send({ error: 'User location not found' });
  }
});

// WebSocket endpoint
app.ws('/chat', (ws, req) => {
  console.log('New WebSocket connection');
  let userId = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received message:', data);

    switch (data.type) {
      case 'join':
        userId = data.userId;
        wsClients.set(userId, ws);
        console.log(`User ${userId} joined chat`);

        if (data.room === 'global') {
          globalChatClients.add(ws);
          console.log(`User ${userId} joined global chat`);
        }
        break;

      case 'message':
        const messageData = {
          id: data.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp,
          senderName: data.senderName || 'Anonymous'
        };

        if (data.room === 'global') {
          broadcastGlobalMessage({
            type: 'globalMessage',
            ...messageData
          });
        } else {
          const receiverConnection = wsClients.get(data.receiverId);
          if (receiverConnection) {
            receiverConnection.send(JSON.stringify({
              type: 'privateMessage',
              ...messageData,
              receiverId: data.receiverId
            }));
          }

          const senderConnections = wsClients.get(data.senderId);
          if (senderConnections && senderConnections !== ws) {
            senderConnections.send(JSON.stringify({
              type: 'privateMessage',
              ...messageData,
              receiverId: data.receiverId
            }));
          }
        }
        break;
    }
  });

  ws.on('close', () => {
    if (userId) {
      wsClients.delete(userId);
      globalChatClients.delete(ws);
      console.log(`User ${userId} disconnected`);
    }
  });
});

const checkUserStatus = async () => {
  const now = Date.now();
  userLocations = userLocations.filter(location => {
    if (!location.currentlyPlaying || now - location.lastUpdated > 300000) {
      return false;
    }
    return true;
  });

  sendEventsToAll(userLocations);
};

setInterval(checkUserStatus, 300000);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});