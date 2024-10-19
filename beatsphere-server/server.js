// server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Kafka, Partitioners } = require('kafkajs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const kafkaBrokers = process.env.KAFKA_BROKERS.split(',');

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

const kafka = new Kafka({
  clientId: 'beat-sphere',
  brokers: kafkaBrokers,
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

const consumer = kafka.consumer({ groupId: 'location-group' });

let userLocations = [];

const run = async () => {
  try {
    // Connect to Kafka producer
    await producer.connect();

    // Connect to Kafka consumer
    await consumer.connect();
    await consumer.subscribe({ topic: 'user_locations', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const location = JSON.parse(message.value.toString());
        console.log(`Received location: ${JSON.stringify(location)}`);

        // Update or add the user's location
        const existingIndex = userLocations.findIndex(loc => loc.id === location.id);
        if (existingIndex !== -1) {
          userLocations[existingIndex] = location;
        } else {
          userLocations.push(location);
        }
      },
    });
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

run().catch(console.error);

app.post('/api/location', async (req, res) => {
  try {
    const { id, latitude, longitude, imageUrl, name } = req.body;
    const newLocation = {
      id,
      name: name || 'User', // Use provided name or default to 'User'
      latitude,
      longitude,
      imageUrl: imageUrl || undefined, // If imageUrl is not provided, it will be undefined
    };

    // Send location data to Kafka
    await producer.send({
      topic: 'user_locations',
      messages: [
        {
          value: JSON.stringify(newLocation),
        },
      ],
    });

    res.status(201).send(newLocation);
  } catch (error) {
    console.error('Error sending location to Kafka:', error);
    res.status(500).send({ error: 'Failed to send location data' });
  }
});

app.get('/api/locations', (req, res) => {
  res.status(200).send(userLocations);
});

// New endpoint to get a specific user's location
app.get('/api/location/:userId', (req, res) => {
  const userId = req.params.userId;
  const userLocation = userLocations.find(location => location.id === userId);
  if (userLocation) {
    res.status(200).send(userLocation);
  } else {
    res.status(404).send({ error: 'User location not found' });
  }
});

// New endpoint to delete a user's location
app.delete('/api/location/:userId', async (req, res) => {
  const userId = req.params.userId;
  const index = userLocations.findIndex(location => location.id === userId);
  if (index !== -1) {
    userLocations.splice(index, 1);
    // Optionally, you can send a message to Kafka about the deletion
    await producer.send({
      topic: 'user_locations_deleted',
      messages: [{ value: userId }],
    });
    res.status(200).send({ message: 'User location deleted' });
  } else {
    res.status(404).send({ error: 'User location not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});