// utils/dbUtils.js
import { ObjectId } from 'mongodb';
import dbClient from './db';

export async function getUserById(userId) {
  // eslint-disable-next-line no-return-await
  return await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
}

export async function insertDocument(collection, document) {
  // eslint-disable-next-line no-return-await
  return await dbClient[collection].insertOne(document);
}
