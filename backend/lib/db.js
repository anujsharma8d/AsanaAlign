const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path   = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const uri    = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB  || 'yoga_intelligence';

let cached = global.__mongo_client;



async function getDb() {
  if (cached?.db) return cached.db;

  const client = new MongoClient(uri);
  try {
    await client.connect();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }

  const db = client.db(dbName);
  cached = { client, db };
  global.__mongo_client = cached;
  return db;
}

module.exports = { getDb };
