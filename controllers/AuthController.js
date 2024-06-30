// AuthController.js
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

export default class AuthController{
  static getConnect = async (req, res) => {
    const authheader = req.headers.authorization;
    if (!authheader) return res.status(401).json({"error": "Unauthorized"});
    const auth = new Buffer.from(authheader.split(' ')[1], 'base64')
      .toString().split(':');
    const email = auth[0];
    const password = auth[1];

    const user = await dbClient.userCollection.findOne({email})
    if (!user) return res.status(401).json({"error": "Unauthorized"});
    if (user.password !== sha1(password)) return res.status(401).json({"error": "Unauthorized"});

    const token = uuidv4();
    const key = `auth_${token}`

    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).json({"token": token});
  };

  static getDisconnect = async (req, res) => {
    await redisClient.del(`auth_${req.headers['x-token']}`);
    return res.status(204).end();
  };
};