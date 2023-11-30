import express, {Request, Response} from 'express';
import { Course } from '../db/models/course';

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
    const courses = await Course.find({})

    return res.status(200).json(courses)
})

router.post('/login', async (req: Request, res: Response) => {
    const { email, password }: FormInputs = req.body

    const course = await Course.findOne({email, password});

    if (!course) {
        return res.status(404).send('Course Not Found!')
    }

    return res.status(200).json(course)
})

router.post('/', async (req: Request, res: Response) => {
  const { name, description, price, creator }: CourseFormInputs = req.body

  const course = Course.build({
    name: name, 
    description: description, 
    price: price,
    creator: creator,
  });

  await course.save();

  return res.status(201).json(course)
})

export default router
