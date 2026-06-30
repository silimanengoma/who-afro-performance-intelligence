import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = Number(process.env.PORT || 4000);
createApp().listen(port, () => {
  console.log(`SAM 1 API listening on http://localhost:${port}`);
});
