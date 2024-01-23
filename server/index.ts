import express, { Express, Request, Response } from 'express'
import './loadEnvironment'
import { receiveMessages } from './rabbitmq/operations'
import cors from 'cors'
import courses from './routes/courses'
import reviews from './routes/reviews'
import './db/conn'
import { generateToken, verifyToken } from './utils/jwtUtils'

const app: Express = express()

app.use(express.json())
app.use(cors())

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World From the Courses Service!')
})

const URLS_ALLOWED_WITHOUT_TOKEN = ['/v1/courses/check']

app.use((req, res, next) => {

    let bearerHeader = req.headers['authorization'] as string;
    let bearerToken: string|undefined = undefined;

    if (bearerHeader !== undefined) {
        let bearer: string[] = bearerHeader.split(' ')
        bearerToken = bearer[1]
    }

    verifyToken(req.url, bearerToken ?? "").then((payload) => {
        if (payload !== undefined) {
            generateToken(payload).then((token) => {
                res.setHeader('Authorization', `Bearer ${token}`)
                next()
            }).catch((err) => {
                console.error(err)
            })
        }else{
            next()
        }
    }).catch((err) => {
        res.status(err.statusCode).json({ error: err.message })
    })

})

const port = process.env.PORT ?? 8000

const MICROSERVICE_QUEUE = 'courses_microservice'

app.use('/v1/courses', courses)
app.use('/v1/reviews', reviews)

receiveMessages(MICROSERVICE_QUEUE)

app.listen(port, () => {
    console.info(`Courses microservice listening on port ${port}`)
})