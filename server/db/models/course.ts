import mongoose, { mongo } from 'mongoose'
import { IUser } from './user';

const { Schema } = mongoose

interface ICourse{
    name: string;
    description: string;
    price: number;
    categories: string[];
    language: string;
    creator: IUser;
    score: number;
    access: IUser[];
    classes: string[];
    materials: string[];
}

interface CourseDoc extends mongoose.Document {
    name: string;
    description: string;
    price: number;
    categories: string[];
    language: string;
    creator: IUser;
    score: number;
    access: IUser[];
    classes: string[];
    materials: string[];
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
    categories: {
        type: [String],
        required: true,
    },
    language: {
        type: String,
        required: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    score: {
        type: Number,
        default: 3,
    },
    access: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
    },
    classes: {
        type: [String],
        required: true,
    },
    materials: {
        type: [String],
        required: true,
    }
})

courseSchema.statics.build = (course: ICourse) => {
    return new Course(course)
}

const Course = mongoose.model<CourseDoc, CourseModelInterface>('Course', courseSchema)

export { Course }