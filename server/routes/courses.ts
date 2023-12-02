import express, {Request, Response} from 'express';
import { Course } from '../db/models/course';

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
    const courses = await Course.find({})

    return res.status(200).json(courses)
})

router.get('/:courseId', async (req: Request, res: Response) => {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);

    return res.status(200).json(course)
})

router.post('/', async (req: Request, res: Response) => {
  const { name, description, price, categories, language, creator }: CourseFormInputs = req.body

  const course = Course.build({
    name: name, 
    description: description, 
    price: price,
    categories: categories,
    language: language,
    creator: creator,
  });

  await course.save();

  return res.status(201).send('Course created!')
})

router.put('/:courseId', async (req: Request, res: Response) => {
  const { name, description, price, categories, language, creator }: CourseFormInputs = req.body
  const courseId = req.params.courseId;

  var course = await Course.findById(courseId);
  if (course) {
    course.name = name;
    course.description = description;
    course.price = price;
    course.categories = categories;
    course.language = language;
    course.creator = creator;

    await course.save();
  
    return res.status(201).json(course)
  }
  else {
    return res.status(404).json(course)
  }
})

router.delete('/:courseId', async (req: Request, res: Response) => {
  const courseId = req.params.courseId;

  await Course.deleteOne({ _id : courseId })
  
  return res.status(200).send("Course deleted!")
})

export default router
