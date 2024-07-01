// controllers/AuthController.js

import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import handleUnauthorized from '../utils/errorUtils';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return handleUnauthorized(res);

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const email = auth[0];
    const password = auth[1];

    const user = await dbClient.userCollection.findOne({ email });
    if (!user || user.password !== sha1(password)) return handleUnauthorized(res);

    const token = uuidv4();
    const key = `auth_${token}`;

    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    await redisClient.del(`auth_${req.headers['x-token']}`);
    return res.status(204);
  }
}

export default AuthController;
