import mongoose from 'mongoose'
const { Schema } = mongoose

enum TypeReview{
    USER = 'USER',
    COURSE = 'COURSE',
    MATERIAL = 'MATERIAL'
}

interface IReview{
    type: TypeReview
    user: string
    creator: string
    title: string
    description: string
    rating: number
    course: string
    material: string
}

interface ReviewDoc extends mongoose.Document {
    type: TypeReview;
    user: string;
    creator: string;
    title: string;
    description: string;
    rating: number;
    course: string;
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
    rating: {
        type: String,
        //required: true,
    },
    course: {
        type: String || '',
    },
    creator: {
        type: String,
    },
    material: {
        type: String || '',
    },
    user:{
        type: String || ''
    }
})

reviewSchema.statics.build = (review: IReview) => {
    return new Review(review)
}

const Review = mongoose.model<ReviewDoc, ReviewModelInterface>('Review', reviewSchema)

export { Review , IReview}