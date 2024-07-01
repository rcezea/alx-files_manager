// controllers/UsersController.js

import sha1 from 'sha1';
import authenticateUser from '../utils/authUtils';
import { getUserById, insertDocument } from '../utils/dbUtils';
import handleUnauthorized from '../utils/errorUtils';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const userOld = await dbClient.userCollection.findOne({ email });
    if (userOld) return res.status(400).json({ error: 'Already exist' });

    const user = { email, password: sha1(password) };
    const newUser = await insertDocument('userCollection', user);
    const userId = newUser.insertedId.toString();

    return res.status(201).json({ id: userId, email });
  }

  static async getMe(req, res) {
    const userId = await authenticateUser(req);
    // if (!userId) return handleUnauthorized(res);

    const user = await getUserById(userId);
    if (!user) return handleUnauthorized(res);

    return res.status(200).json({ id: userId, email: user.email });
  }
}

export default UsersController;
