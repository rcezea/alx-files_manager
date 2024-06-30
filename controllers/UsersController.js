import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
      });
    }
    if (!password) {
      return res.status(400).json({
        error: 'Missing password',
      });
    }

    // Check if user already exists
    const userOld = await dbClient.userCollection.findOne({ email });
    if (userOld) return res.status(400).json({ error: 'Already exist' });

    // Create the new user
    const user = await dbClient.userCollection.insertOne({ email, password: sha1(password) });
    const userId = user.insertedId.toString();

    return res.status(201).json({
      id: userId,
      email,
    });
  }

  static async getMe(req, res) {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({
      id: userId,
      email: user.email,
    });
  }
}
module.exports = UsersController;
