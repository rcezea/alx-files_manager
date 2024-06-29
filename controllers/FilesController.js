// FilesController.js

import redisClient from "../utils/redis";
import {ObjectId} from "mongodb";
import dbClient from "../utils/db";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import fs from 'node:fs';
dotenv.config()

export const postUpload = async (req, res) => {
  // find user from token
  const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
  if (!userId) return res.status(401).json({"error": "Unauthorized"});
  const id = new ObjectId(userId);
  const user = await dbClient.userCollection.findOne({"_id": id});
  if (!user) return res.status(401).json({"error": "Unauthorized"});


  const file = {
    userId: userId,
    name: req.body.name || null,
    type: req.body.type || null,
    parentId: req.body.parentId || 0,
    isPublic: req.body.isPublic || false,
    data: req.body.data || null,
  }

  // console.log(file);
  if (!file.name) return res.status(400).json({"error": "Missing name"});
  if (!file.type) return res.status(400).json({"error": "Missing type"});
  if (!file.data && file.type !== 'folder') return res.status(400).json({"error": "Missing data"});

  if (file.parentId !== 0){
    const parentId = new ObjectId(file.parentId);
    const storedFile = await dbClient.fileCollection.findOne({"_id": parentId});
    // console.log(storedFile)
    if (!storedFile) return res.status(400).json({"error": "Parent not found"});
    if(storedFile.type !== 'folder') return res.status(400).json({"error": "Parent is not a folder"});
  }

  if (file.type === 'folder'){
    const newFile = await dbClient.fileCollection.insertOne(file);
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
  fs.opendir(path, (err, dir) => {
    if (err) console.log("Error:", err);
    else {
      const filename = uuidv4();
      let data = new Buffer.from(file.data, 'base64');
      // console.log(data);
      // Print the pathname of the directory
      // console.log("Path of the directory:", dir.path);
      // console.log("Data sent", data[0]);
      let p = `${path}/${filename}`;
       /*
       * An encoded file is stored in the database
       * I wanted to see if saving the file with an extension would reconstruct the file
       * It worked
       * But that is not required in this project.
       */
      // if (file.type === 'image') {
      //   p = `${path}/${filename}.png`;
      // } else {
      //   p = `${path}/${filename}`;
      // }

      fs.writeFile(p, data,{flag: 'a'}, async err => {
        if (err) {
          console.error(err);
        } else {
          file.localPath = p;
          const newFile = await dbClient.fileCollection.insertOne(file);
          return res.status(201).json({
            id: newFile.insertedId.toString(),
            userId,
            name: file.name,
            type: file.type,
            isPublic: file.isPublic,
            parentId: file.parentId,
          });
        }
      });

      // Close the directory
      // console.log("Closing the directory");
      dir.closeSync();
    }
  })
}

export const getShow = async (req, res) => {
  // const fileId = new ObjectId(req.params.id);
  // console.log(fileId);

  const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
  if (!userId) return res.status(401).json({"error": "Unauthorized"});
  // const id = new ObjectId(userId);
  const user = await dbClient.userCollection.findOne({"_id": new ObjectId(userId)});
  if (!user) return res.status(401).json({"error": "Unauthorized"});
  const file = await dbClient.fileCollection.findOne({userId, "_id": new ObjectId(req.params.id)});
  if(!file) return res.status(404).json({"error": "Not found"});
  return res.status(200).json({
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId
  });
}

export const getIndex = async (req, res) => {
  // retrieve the parentId
  const parentId = req.query.parentId || 0;

  // retrieve user based on the token
  const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
  if (!userId) return res.status(401).json({"error": "Unauthorized"});
  // const id = new ObjectId(userId);
  const user = await dbClient.userCollection.findOne({"_id": new ObjectId(userId)});
  if (!user) return res.status(401).json({"error": "Unauthorized"});

  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const files = await dbClient.fileCollection.aggregate([
    { $match: { parentId: parentId } },
    { $skip: skip },
    { $limit: pageSize },
    {
      $project: {
        _id: 1,
        userId: 1,
        name: 1,
        type: 1,
        isPublic: 1,
        parentId: 1,
      }
    }
  ]).toArray();
  // console.log(files);
  return res.status(200).send(files);
};

// curl -XPOST 0.0.0.0:3000/files -H "X-Token: b182d152-4148-4cec-8352-c9c34d7fd493" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' ; echo ""
// curl 0.0.0.0:3000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
// {"token":"b182d152-4148-4cec-8352-c9c34d7fd493"}

// curl -XPOST 0.0.0.0:3000/files -H "X-Token: b182d152-4148-4cec-8352-c9c34d7fd493" -H "Content-Type: application/json" -d '{ "name": "images", "type": "folder" }' ; echo ""
// curl -XGET 0.0.0.0:3000/files?parentId=5f1e881cc7ba06511e683b23 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
// curl -XGET 0.0.0.0:3000/files/668034e6fd5ac301bd955f9e -H "X-Token: b182d152-4148-4cec-8352-c9c34d7fd493" ; echo ""


// echo 'db.users.find()' | mongosh files_manager
// echo 'db.files.find()' | mongosh files_manager

// curl -XGET 0.0.0.0:3000/files -H "X-Token: b182d152-4148-4cec-8352-c9c34d7fd493" ; echo ""
