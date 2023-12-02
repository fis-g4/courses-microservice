import express, {Request, Response} from 'express';
import { Course } from '../db/models/course';

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
    try {
      let filters: { [key: string]: any } = {};

      // Loop through query parameters
      Object.keys(req.query).forEach((key) => {
          // If the attribute is a list, handle it with $in
          if (key === 'categories' || key === 'otherListAttribute') {
            // @ts-ignore
            filters[key] = { $all: Array.isArray(req.query[key]) ? req.query[key].split(" ") : req.query[key].split(" ") };
          } else {
            // If it's a single value attribute, directly assign the value
            filters[key] = req.query[key];
          }
      });

      const courses = await Course.find(filters);

      return res.status(200).json(courses);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.get('/:courseId', async (req: Request, res: Response) => {
    try {
      const courseId = req.params.courseId;
      const course = await Course.findById(courseId);
      if (course)
        return res.status(200).json(course)
      else
      return res.status(404).json({ error: 'Course not found' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.put('/:courseId', async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.delete('/:courseId', async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId;
  
    await Course.deleteOne({ _id : courseId })
    
    return res.status(200).send("Course deleted!")
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})

export default router
