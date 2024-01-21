import mongoose, { ObjectId } from 'mongoose'

const { Schema } = mongoose

enum PlanType{
    BASIC = 'BASIC',
    ADVANCED = 'ADVANCED',
    PRO = 'PRO'
}

enum UserRole{
    USER = 'USER',
    ADMIN = 'ADMIN'
}

interface IUser {
    [key: string]: any
    _id?: ObjectId
    firstName: string
    lastName: string
    username: string
    password: string
    email: string
    profilePicture: string
    coinsAmount: number
    plan: PlanType
    role: UserRole
}

interface UserDoc extends mongoose.Document {
    _id?: ObjectId
    firstName: string
    lastName: string
    username: string
    password: string
    email: string
    profilePicture: string
    coinsAmount: number
    plan: PlanType
    role: UserRole
}

interface UserModelInterface extends mongoose.Model<UserDoc> {
    build(attr: IUser): UserDoc
}

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            trim: true,
            //required: true,
        },
        lastName: {
            type: String,
            trim: true,
            //required: true,
        },
        username: {
            type: String,
            unique: true,
            trim: true,
            //required: true,
        },
        password: {
            type: String,
            trim: true,
            //required: true,
        },
        email: {
            type: String,
            unique: true,
            trim: true,
            //required: true,
        },
        profilePicture: {
            type: String,
            trim: true,
        },
        coinsAmount: {
            type: Number,
            default: 0,
        },
        plan: {
            type: String,
            enum: Object.values(PlanType),
            default: PlanType.BASIC,
            trim: true,
        },

        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
            trim: true,
        }

    },
    {
        virtuals: {
            fullName: {
                get() {
                    return (this.firstName ?? '') + ' ' + (this.lastName ?? '')
                },
            },
        },
    }
)

userSchema.statics.build = (user: IUser) => {
    return new User(user)
}

const User = mongoose.model<UserDoc, UserModelInterface>('User', userSchema)

export { User, IUser, PlanType, UserRole }
