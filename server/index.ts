import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import courses from './routes/courses'
import './loadEnvironment'
import './db/conn'

const app: Express = express()

app.use(express.json())
app.use(cors())

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World From the Typescript Server!')
})

const port = process.env.PORT ?? 8000

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.use('/courses', courses)
