/* eslint-disable @typescript-eslint/no-unused-vars -- Remove when used */
import 'dotenv/config';
import express from 'express';
import {
  ClientError,
  errorMiddleware,
  uploadsMiddleware,
} from './lib/index.js';
import { searchGif } from './lib/giphy.js';
import { openAIImageMiddleware } from './lib/openai-middleware.js';
import { deleteFile } from './lib/deleteFile.js';

const app = express();

const reactStaticDir = new URL('../client/dist', import.meta.url).pathname;
const uploadsStaticDir = new URL('public', import.meta.url).pathname;

app.use(express.static(uploadsStaticDir));
app.use(express.static(reactStaticDir));

// Static directory for file uploads server/public/
app.use(express.static('public'));
app.use(express.json());

app.get('/api/giphy/search/:query', async (req, res, next) => {
  try {
    const query = req.params.query;
    const resp = await searchGif(query);
    res.send(resp);
  } catch (err) {
    next(err);
  }
});

app.post(
  '/api/openAI/upload',
  uploadsMiddleware.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new ClientError(400, 'no file field in request');
      const filepath = req.file.path;
      const aiResponse = await openAIImageMiddleware(filepath);
      res.json({ aiResponse, fileName: req.file.filename });
    } catch (err) {
      next(err);
    }
  }
);

app.delete('/api/image/:path', async (req, res, next) => {
  try {
    const path = req.params.path;
    await deleteFile(path);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log('Listening on port', process.env.PORT);
});
