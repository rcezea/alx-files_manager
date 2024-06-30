//UsersController.js
import dbClient from '../utils/db';
import sha1 from 'sha1'
import redisClient from "../utils/redis";
import {ObjectId} from 'mongodb';


export default class UsersController{
  static postNew = async (req, res) => {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({
        "error": "Missing email"
      })
    }
    if (!password) {
      res.status(400).json({
        "error": "Missing password"
      })
    }
    // check if user already exists
    const userOld = await dbClient.userCollection.findOne({email});
    if (userOld) return res.status(400).json({"error": "Already exist"});

    // create the new user
    const user = await dbClient.userCollection.insertOne({"email": email, password: sha1(password)});
    // console.log(user);
    const userId = user.insertedId.toString();

    // console.log(user.insertedId);
    // or use user.ops[0]._id;


    return res.status(201).json({
      id: userId,
      email
    });
  };

  static getMe = async (req, res) => {
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    // console.log(userId);
    if (!userId) return res.status(401).json({"error": "Unauthorized"});

    // const id = new ObjectId(userId);
    const user = await dbClient.userCollection.findOne({"_id": new ObjectId(userId)})
    // console.log(user);
    if (!user) return res.status(401).json({"error": "Unauthorized"});

    return res.status(200).json({
      id: userId,
      email: user.email
    });
  }
};
// curl 0.0.0.0:3000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
// curl 0.0.0.0:3000/users/me -H "X-Token: a4a4e086-819d-47ee-b5b0-a82748597a08" ; echo ""
// curl 0.0.0.0:3000/disconnect -H "X-Token: a4a4e086-819d-47ee-b5b0-a82748597a08" ; echo ""
