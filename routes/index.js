import express from 'express';
import AppController from '../controllers/AppController';
// import {postNew, getMe} from '../controllers/UsersController';
// import {getConnect, getDisconnect} from '../controllers/AuthController';
// import {postUpload, getShow, getIndex, putPublish, putUnpublish} from '../controllers/FilesController';

const router = express.Router();


router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
/*
router.post('/users', postNew);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);
router.post('/files', postUpload);
router.get('/files/:id', getShow);
router.get('/files', getIndex);
router.put('/files/:id/publish', putPublish);
router.put('/files/:id/unpublish', putUnpublish)
*/

module.exports = router;
