import mongoose from 'mongoose'

const { Schema } = mongoose

interface IMaterializedView {
    firstName: string
    lastName: string
    username: string
    profilePicture: string
}

interface MaterializedViewDoc extends mongoose.Document {
    firstName: string
    lastName: string
    username: string
    profilePicture: string
}

interface MaterializedViewInterface extends mongoose.Model<MaterializedViewDoc> {
    build(attr: IMaterializedView): MaterializedViewDoc;
}


const materializedViewSchema = new Schema(
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
        profilePicture: {
            type: String,
            trim: true,
        },
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

materializedViewSchema.statics.build = (user: IMaterializedView) => {
    return new MaterializedView(user)
}

const MaterializedView = mongoose.model<MaterializedViewDoc, MaterializedViewInterface>('MaterializedView', materializedViewSchema)

export { MaterializedView }