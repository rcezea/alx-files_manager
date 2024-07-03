// controllers/FilesController.js

import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import authenticateUser from '../utils/authUtils';
import { getUserById, insertDocument } from '../utils/dbUtils';
import handleUnauthorized from '../utils/errorUtils';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const userId = await authenticateUser(req);
    if (!userId) return handleUnauthorized(res);
    const user = await getUserById(userId);
    if (!user) return handleUnauthorized(res);

    const file = {
      userId,
      name: req.body.name || null,
      type: req.body.type || null,
      parentId: req.body.parentId || 0,
      isPublic: req.body.isPublic || false,
    };
    let data = req.body.data || null;

    if (!file.name) return res.status(400).json({ error: 'Missing name' });
    if (!file.type) return res.status(400).json({ error: 'Missing type' });
    if (!data && file.type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (file.parentId !== 0) {
      const parentId = new ObjectId(file.parentId);
      const storedFile = await dbClient.fileCollection.findOne({ _id: parentId });
      if (!storedFile) return res.status(400).json({ error: 'Parent not found' });
      if (storedFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (file.type === 'folder') {
      const newFile = await insertDocument('fileCollection', file);
      return res.status(201).json({
        id: newFile.insertedId.toString(),
        userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    }

    const path = process.env.FOLDER_PATH || '/tmp/files_manager';
    fs.mkdirSync(path, { recursive: true });

    try {
      await fs.promises.opendir(path);
      const filename = uuidv4();
      data = Buffer.from(data, 'base64');
      const filePath = `${path}/${filename}`;

      await fs.promises.writeFile(filePath, data);
      file.localPath = filePath;

      const newFile = await insertDocument('fileCollection', file);
      return res.status(201).json({
        id: newFile.insertedId.toString(),
        userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    const userId = await authenticateUser(req);
    if (!userId) return handleUnauthorized(res);

    const user = await getUserById(userId);
    if (!user) return handleUnauthorized(res);

    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Not found' });
    const file = await dbClient.fileCollection.findOne({
      userId,
      _id: new ObjectId(req.params.id),
    });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const parentId = req.query.parentId || '0';
    const userId = await authenticateUser(req);
    if (!userId) return handleUnauthorized(res);

    const user = await getUserById(userId);
    if (!user) return handleUnauthorized(res);

    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
    const skip = page * pageSize;
    let query;
    if (parentId === '0') {
      query = { userId };
    } else {
      query = { userId, parentId };
    }
    const cursor = dbClient.fileCollection.aggregate([
      { $match: query },
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: '$parentId',
        },
      },
    ]);
    const files = await cursor.toArray();
    if (!files) res.status(200).send([]);
    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const userId = await authenticateUser(req);
    if (!userId) return handleUnauthorized(res);

    const user = await getUserById(userId);
    if (!user) return handleUnauthorized(res);

    const param = { userId, _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: {
        isPublic: true,
      },
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
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const userId = await authenticateUser(req);
    if (!userId) return handleUnauthorized(res);

    const user = await getUserById(userId);
    if (!user) return handleUnauthorized(res);

    const param = { userId, _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: {
        isPublic: false,
      },
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
      parentId: file.parentId,
    });
  }
}

export default FilesController;
