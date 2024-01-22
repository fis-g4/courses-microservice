import mongoose from 'mongoose'
import { ICourse } from './course';
import { IUser } from './user';
import { IMaterial } from './material';
const { Schema } = mongoose

interface IReview{
    title: string;
    description: string;
    score: number;
    course: string;
    creator: string;
    material: string;
}

interface ReviewDoc extends mongoose.Document {
    title: string;
    description: string;
    score: number;
    course: string;
    creator: string;
    material: string;
}

interface ReviewModelInterface extends mongoose.Model<ReviewDoc> {
    build(attr: IReview): ReviewDoc;
}


const reviewSchema = new Schema({
    title: {
        type: String,
        //required: true,
    },
    description: {
        type: String,
        //required: true,
    },
    score: {
        type: Number,
        //required: true,
    },
    course: {
        type: String,
    },
    creator: {
        type: String,
    },
    material: {
        type: String,
    },
})

reviewSchema.statics.build = (review: IReview) => {
    return new Review(review)
}

const Review = mongoose.model<ReviewDoc, ReviewModelInterface>('Review', reviewSchema)

export { Review , IReview}