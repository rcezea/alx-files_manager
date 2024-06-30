import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs';

class FilesController {
  static postUpload = async (req, res) => {
    // Find user from token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = new ObjectId(userId);
    const user = await dbClient.userCollection.findOne({ _id: id });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const file = {
      userId,
      name: req.body.name || null,
      type: req.body.type || null,
      parentId: req.body.parentId || 0,
      isPublic: req.body.isPublic || false,
      data: req.body.data || null
    };

    if (!file.name) return res.status(400).json({ error: 'Missing name' });
    if (!file.type) return res.status(400).json({ error: 'Missing type' });
    if (!file.data && file.type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (file.parentId !== 0) {
      const parentId = new ObjectId(file.parentId);
      const storedFile = await dbClient.fileCollection.findOne({ _id: parentId });
      if (!storedFile) return res.status(400).json({ error: 'Parent not found' });
      if (storedFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (file.type === 'folder') {
      const newFile = await dbClient.fileCollection.insertOne(file);
      return res.status(201).json({
        id: newFile.insertedId.toString(),
        userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId
      });
    }

    const path = process.env.FOLDER_PATH || '/tmp/files_manager';
    fs.mkdirSync(path, { recursive: true });
    fs.opendir(path, (err, dir) => {
      if (err) {
        console.error('Error:', err);
      } else {
        const filename = uuidv4();
        const data = Buffer.from(file.data, 'base64');
        const filePath = `${path}/${filename}`;

        fs.writeFile(filePath, data, { flag: 'a' }, async (writeErr) => {
          if (writeErr) {
            console.error(writeErr);
          } else {
            file.localPath = filePath;
            const newFile = await dbClient.fileCollection.insertOne(file);
            return res.status(201).json({
              id: newFile.insertedId.toString(),
              userId,
              name: file.name,
              type: file.type,
              isPublic: file.isPublic,
              parentId: file.parentId
            });
          }
        });

        dir.closeSync();
      }
    });
  };

  static getShow = async (req, res) => {
    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Retrieve file from user id and file id
    const file = await dbClient.fileCollection.findOne({ userId, _id: new ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    });
  };

  static getIndex = async (req, res) => {
    // Retrieve the parentId
    const parentId = req.query.parentId || 0;

    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const files = await dbClient.fileCollection.aggregate([
      { $match: { parentId } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          type: 1,
          isPublic: 1,
          parentId: 1
        }
      }
    ]).toArray();

    return res.status(200).send(files);
  };

  static putPublish = async (req, res) => {
    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Retrieve file from user id and file id
    const param = { userId, _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: {
        isPublic: true
      }
    };

    const updatedFile = await dbClient.fileCollection.updateOne(param, updateDoc);
    if (!updatedFile) return res.status(404).json({ error: 'Not found' });

    const file = await dbClient.fileCollection.findOne(param);

    return res.status(200).json({
      id: file._id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    });
  };

  static putUnpublish = async (req, res) => {
    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Retrieve file from user id and file id
    const param = { userId, _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: {
        isPublic: false
      }
    };

    const updatedFile = await dbClient.fileCollection.updateOne(param, updateDoc);
    if (!updatedFile) return res.status(404).json({ error: 'Not found' });

    const file = await dbClient.fileCollection.findOne(param);
    return res.status(200).json({
      id: file._id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    });
  };
}
module.exports = FilesController;
