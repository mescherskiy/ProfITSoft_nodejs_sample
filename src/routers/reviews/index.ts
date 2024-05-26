import express from 'express';
import {
    countReviewsInMovies,
    createReview,
    getAllMovieReviews,
} from 'src/controllers/reviews';

const router = express.Router();

router.post('', createReview);
router.get('', getAllMovieReviews);
router.post('/_count', countReviewsInMovies);

export default router;
