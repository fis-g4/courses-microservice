import express, { Express, NextFunction, Request, Response } from 'express'
import './loadEnvironment'
import cors from 'cors'
import courses from './routes/courses'
import reviews from './routes/reviews'
import './db/conn'
import { generateToken, verifyToken } from './utils/jwtUtils'
import yaml from 'yaml'
import fs from 'fs';
import { receiveMessages } from './rabbitmq/operations'
import swaggerjsdoc from 'swagger-jsdoc'
import swaggerui from 'swagger-ui-express'
const app: Express = express()

app.use(express.json())
app.use(cors())

const swaggerJsDoc = swaggerjsdoc
const swaggerUI = swaggerui
const swaggerUICourse = swaggerui

const swaggerOptionsReviews = {
    definition: {
        openapi: '3.1.0',
        info: {
            version: '1.0.0',
            title: 'Reviews/Courses Microservice API',
            description:
                'API for the reviews/courses microservice of the FIS-G4 project.',
            contact: {
                name: 'David Barragán y Mathew Byte',
                email: '',
                url: 'https://github.com/fis-g4/courses-microservice',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url:
                    process.env.BASE_URL ?? 'http://localhost:8000/v1/reviews',
            },
            {
                url:
                    process.env.BASE_URL ?? 'http://localhost:8000/v1/courses',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/reviews.ts', './routes/courses.ts'],
}
/*
const swaggerOptionsCourses = {
    definition: {
        openapi: '3.1.0',
        info: {
            version: '1.0.0',
            title: 'Reviews/Courses Microservice API',
            description:
                'API for the reviews/courses microservice of the FIS-G4 project.',
            contact: {
                name: 'Mathew Byte',
                email: '',
                url: 'https://github.com/fis-g4/courses-microservice',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url:
                    process.env.BASE_URL ?? 'http://localhost:8000/v1/reviews',
            },
            {
                url:
                    process.env.BASE_URL ?? 'http://localhost:8000/v1/courses',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/courses.ts'],
}

*/
const swaggerDocsReviews = swaggerJsDoc(swaggerOptionsReviews);
const yamlStringReviews: string = yaml.stringify(swaggerDocsReviews, {});
//const swaggerDocsCourses = swaggerJsDoc(swaggerOptionsCourses);
//const yamlStringCourses: string = yaml.stringify(swaggerDocsCourses, {});
fs.writeFileSync('./docs/swaggerReviews.yaml', yamlStringReviews);
//fs.writeFileSync('./docs/swaggerCourses.yaml', yamlStringCourses);
app.use(
    '/v1/courses/docs/',
    swaggerUI.serve,
    swaggerUI.setup(swaggerDocsReviews, { explorer: true })
);
/*
app.use(
    '/v1/courses/docs/',
    swaggerUICourse.serve,
    swaggerUICourse.setup(swaggerDocsCourses, { explorer: true })
);
*/
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