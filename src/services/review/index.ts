import { ReviewInfoDto } from 'src/dto/review/reviewInfoDto';
import { ReviewQueryDto } from 'src/dto/review/reviewQueryDto';
import { ReviewSaveDto } from 'src/dto/review/reviewSaveDto';
import Review, { IReview } from 'src/model/review';
import log4js from 'log4js';

export const saveNewReview = async (
    reviewDto: ReviewSaveDto
): Promise<string> => {
    await validateReview(reviewDto);
    const review = await new Review(reviewDto).save();
    return review._id;
};

export const findMovieReviews = async (
    query: ReviewQueryDto
): Promise<ReviewInfoDto[]> => {
    await validateQuery(query);
    const reviews = await Review.find({
        movieId: query.movie,
    })
        .limit(query.size as number)
        .skip(query.from as number - 1)
        .sort({ createdAt: -1 });

    return reviews.map(review => toInfoDto(review));
}

export const countReviews = async (
    movieIds: number[]
): Promise<{ [key: number]: number }> => {
    const reviewCounts = await Review.aggregate([
        {
            $match: {
                movieId: {
                    $in: movieIds
                }
            }
        },
        {
            $group: {
                _id: "$movieId", count: { $sum: 1 }
            }
        }
    ]);
    const result: { [key: number]: number } = {};
    movieIds.forEach(id => result[id] = 0);
    reviewCounts.forEach((item: {_id: number, count: number}) => {
        result[item._id] = item.count;
    });
    return result;
}

const validateReview = async (reviewDto: ReviewSaveDto) => {
    const { title, text, movieId } = reviewDto;
    if (!title || !text || !movieId) {
        throw new Error("Title, text and movieId are required");
    }
    if (typeof title !== "string") {
        throw new Error("Title should be in string format");
    }
    if (typeof text !== "string") {
        throw new Error("Text should be in string format");
    }
    if (typeof movieId !== "number") {
        throw new Error("MovieID should be a number");
    }
    const url = `http://localhost:8080/api/movie/${movieId}`;
    const response = await fetch(
        url,
        {
            method: "GET",
            headers: {
                "content-type": "application/json;charset=UTF-8",
            }
        }
    );
    if (response.status !== 200) {
        throw new Error(`Movie with id ${movieId} not found`);
    }
    const rev = await Review.findOne({
        title,
        text,
        movieId
    })
    if (rev) {
        log4js.getLogger().error(`Review with title: ${title}, text: ${text} and movieId: ${movieId} already exists. Review: ${rev}`)
        throw new Error("Review already exists");
    }
};

const validateQuery = async (query: ReviewQueryDto) => {
    const { movie, size, from } = query;
    if (!movie || !size || !from) {
        throw new Error("Missing or wrong params in query");
    }
    if (typeof movie !== "number" || movie < 1) {
        throw new Error("Wrong movieID");
    }
    if (typeof size !== "number" || size < 1) {
        throw new Error("Size should be a number and not less than 1");
    }
    if (typeof from !== "number" || from < 1) {
        throw new Error("From should be number and not less than 1");
    }
}

const toInfoDto = (review: IReview): ReviewInfoDto => {
    return ({
        _id: review._id,
        title: review.title,
        text: review.text,
        movieId: review.movieId,
        createdAt: review.createdAt
    });
};
