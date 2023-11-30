import mongoose, { mongo } from 'mongoose'
import { IUser } from './user';

const { Schema } = mongoose

interface ICourse{
    name: string;
    description: string;
    price: number;
    creator: IUser;
}

interface CourseDoc extends mongoose.Document {
    name: string;
    description: string;
    price: number;
    creator: IUser;
}

interface CourseModelInterface extends mongoose.Model<CourseDoc> {
    build(attr: ICourse): CourseDoc;
}


const courseSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
})

courseSchema.statics.build = (course: ICourse) => {
    return new Course(course)
}

const Course = mongoose.model<CourseDoc, CourseModelInterface>('Course', courseSchema)

export { Course }