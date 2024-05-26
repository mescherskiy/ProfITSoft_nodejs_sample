import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    title: string;
    text: string;
    movieId: number;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema({
    title: {
        required: true,
        type: String,
    },
    text: {
        required: true,
        type: String,
    },
    movieId: {
        required: true,
        type: Number,
        ref: "Movie"
    },
},
    {
        timestamps: true,
        timezone: 'UTC',
    },
);

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;