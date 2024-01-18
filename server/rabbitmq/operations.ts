import amqplib, { Channel, Connection } from 'amqplib'
import axios from 'axios'
import { Course } from '../db/models/course'
import redisClient from '../db/redis'
import { MaterliaziedView } from '../db/models/materializedView'

let channel: Channel, connection: Connection
const FIVE_HOURS = 60 * 60 * 5

async function sendMessage(
    dest: string,
    operationId: string,
    API_KEY: string,
    message?: string
) {
    try {
        await axios.post(
            `http://${process.env.DOCKER_HOST}:8080/api/v1/messages/${dest}`,
            {
                operationId,
                message,
            },
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error(error)
    }
}

async function receiveMessages(queue: string) {
    try {
        const amqpServer = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@rabbitmq:5672`
        connection = await amqplib.connect(amqpServer)
        channel = await connection.createChannel()
        await channel.consume(queue, (data) => {
            console.info(`Received ${Buffer.from(data!.content)}`)
            handleMessages(data!.content.toString())
            channel.ack(data!)
        })
    } catch (error) {
        console.error(error)
    }
}

async function handleMessages(message: string) {
    const jsonMessage = JSON.parse(message)
    const operationId = jsonMessage.operationId
    const messageContent = jsonMessage.message
    if (operationId === 'publishNewCourseAccess') {
        const username = messageContent.username
        const courseId = messageContent.courseId

        const course = await Course.findById(courseId)
        if (course) {
            if (!course.access.includes(username)) {
                course.access.push(username)
                await course.save()
            }
        }
    } else if (operationId === 'responseAppClassesAndMaterials') {
        const courseId = messageContent.courseId
        const classes = messageContent.classIds
        const materials = messageContent.materialIds
        
        await redisClient.set(courseId + " classes", classes, { EX: FIVE_HOURS })
        await redisClient.set(courseId + " materials", materials, { EX: FIVE_HOURS })
    } else if (operationId === 'notificationNewClass') {
        const classId = messageContent.classId
        const courseId = messageContent.courseId

        const course = await Course.findById(courseId)
        if (course) {
            if (!course.classes.includes(classId)) {
                course.classes.push(classId)
                await course.save()
            }
        }
    } else if (operationId === 'notificationDeleteClass') {
        const classId = messageContent.classId
        const courseId = messageContent.courseId

        const course = await Course.findById(courseId)
        if (course) {
            if (!course.classes.includes(classId)) {
                course.classes.filter(item => item != classId)
                await course.save()
            }
        }
    } else if (operationId === 'notificationAssociateMaterial') {
        const materialId = messageContent.materialId
        const courseId = messageContent.courseId

        const course = await Course.findById(courseId)
        if (course) {
            if (!course.materials.includes(materialId)) {
                course.materials.push(materialId)
                await course.save()
            }
        }
    } else if (operationId === 'notificationDisassociateMaterial') {
        const materialId = messageContent.materialId
        const courseId = messageContent.courseId

        const course = await Course.findById(courseId)
        if (course) {
            if (!course.materials.includes(materialId)) {
                course.materials.filter(item => item != materialId)
                await course.save()
            }
        }
    } else if (operationId === 'notificationUserDeletion') {
        const deletedUsername = messageContent.username
        
        const courses = await Course.find({ creator : deletedUsername })

        courses.map(async (course) => {
            course.access = course.access.filter((username) => username !== deletedUsername);
            await course.save();
        });

        const courseIds = courses
        const data = {
            courseIds,
        }

        await sendMessage(
            'learning-microservice',
            'notificationDeleteManyCourses',
            process.env.API_KEY ?? '',
            JSON.stringify(data)
        )

        await Course.deleteMany({ creator : deletedUsername })
        await MaterliaziedView.deleteMany({ username : deletedUsername })
    }
}

export { receiveMessages, sendMessage }
