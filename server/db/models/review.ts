import mongoose from 'mongoose'
import { ICourse } from './course';
import { IUser } from './user';
import { IMaterial } from './material';
const { Schema } = mongoose

interface IReview{
    title: string;
    description: string;
    score: number;
    course: ICourse | null;
    creator: IUser | null;
    material: IMaterial | null;
}

interface ReviewDoc extends mongoose.Document {
    title: string;
    description: string;
    score: number;
    course: ICourse | null;
    creator: IUser | null;
    material: IMaterial | null;
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
    },
})

reviewSchema.statics.build = (review: IReview) => {
    return new Review(review)
}

const Review = mongoose.model<ReviewDoc, ReviewModelInterface>('Review', reviewSchema)

export { Review , IReview}