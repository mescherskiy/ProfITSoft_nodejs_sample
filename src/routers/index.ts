import express from 'express';
import ping from 'src/controllers/ping';
import reviews from './reviews';

const router = express.Router();

router.get('/ping', ping);

router.use('/reviews', reviews);

export default router;
