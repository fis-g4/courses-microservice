import populateDB from './populateInitial';
import mongoose from 'mongoose'

if (process.env.npm_config_run_tests==='true') {
    mongoose
        .connect(`${process.env.DB_URI ?? ''}`,
        {
            dbName: `${process.env.DB_DATABASE ?? ''}`,
            user: `${process.env.DB_USER ?? ''}`,
            pass: `${process.env.DB_PASS ?? ''}`,
            //authSource: `${process.env.AUTH_DB ?? ''}`,
        })
        .then(() => {
            console.log('Connected to MongoDB TEST')
            populateDB();
        })
        .catch((err) => {
            console.log(err)
        })
} else {
    mongoose
    .connect(`${process.env.DB_URI ?? ''}`,
    {
        dbName: `${process.env.DB_DATABASE ?? ''}`,
        user: `${process.env.DB_USER ?? ''}`,
        pass: `${process.env.DB_PASS ?? ''}`,
        //authSource: `${process.env.AUTH_DB ?? ''}`,
    })
    .then(() => {
        console.log('Connected to MongoDB')
        populateDB();
    })
    .catch((err) => {
        console.log(err)
    })
}