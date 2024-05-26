import { InternalError } from "src/system/internalError"
import log4js from 'log4js';
import { Request, Response } from 'express';
import { ReviewSaveDto } from "src/dto/review/reviewSaveDto";
import httpStatus from "http-status";
import { countReviews, findMovieReviews, saveNewReview } from "src/services/review";
import { ReviewQueryDto } from "src/dto/review/reviewQueryDto";

export const createReview = async (req: Request, res: Response) => {
    try {
        const review = new ReviewSaveDto(req.body);
        const id = await saveNewReview({
            ...review,
        });
        res.status(httpStatus.CREATED).send({
            id,
        });
    } catch (error) {
        const { message, status } = new InternalError(error);
        log4js.getLogger().error('Error in creating review:', error);
        res.status(status).send({ message });
    }
}

export const getAllMovieReviews = async (req: Request, res: Response) => {
    const query = new ReviewQueryDto(req.query);
    try {
        const reviews = await findMovieReviews(query);
        res.status(httpStatus.OK).send({
            reviews
        });
    } catch (err) {
        const { message, status } = new InternalError(err);
        log4js.getLogger().error('Error in finding reviews by query:', err);
        res.status(status).send({ message });
    }
}

export const countReviewsInMovies = async (req: Request, res: Response) => {
    const { movieIds } = req.body;
    log4js.getLogger().info("MovieIds: ", movieIds)

    if (!Array.isArray(movieIds) || !movieIds.length) {
        res.status(httpStatus.BAD_REQUEST).send({
            message: 'MovieIds must be an array'
        });
    }

    try {
        const reviewCounts = await countReviews(movieIds);
        res.status(httpStatus.OK).send({
            ...reviewCounts
        })
    } catch (err) {
        const { message, status } = new InternalError(err);
        log4js.getLogger().error('Error in counting reviews:', err);
        res.status(status).send({ message });
    }
}