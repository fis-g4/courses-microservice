import express, {Request, Response} from 'express';
import { Course } from '../db/models/course';
import { sendMessage } from '../rabbitmq/operations'
import redisClient from '../db/redis'
import {
    IUser,
    getPayloadFromToken,
    getTokenFromRequest,
} from '../utils/jwtUtils'
import { MaterializedView } from '../db/models/materializedView';

const router = express.Router()

router.get('/check', async (req: Request, res: Response) => {
  return res
      .status(200)
      .json({ message: 'The courses service is working properly!' })
})

router.get('/categories', async (req: Request, res: Response) => {
  
  const courses = await Course.find({});

  // Create an empty dictionary to store category counts
  const categoryCounts: { [key: string]: number } = {};

  // Iterate through each course
  courses.forEach((course) => {
    // Iterate through each category in the course
    course.categories.forEach((category) => {
      // Update the count in the dictionary
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  });

  return res.status(200).json(categoryCounts);
})

router.get('/best', async (req: Request, res: Response) => {
  const courses = await Course.find().sort({ score: -1 }).limit(6);

    const modifiedCourses = await Promise.all(courses.map(async course => {
      const user = await MaterializedView.findOne({ username: course.creator });
      if (user) {
        return {
          ...course.toObject(), // Convert Mongoose document to plain JavaScript object
          creator: user.firstName + " " + user.lastName // Change 'newUsername' to the desired value
        };
      }
      else {
        return {
          course
        };
      }
    }))

    return res.status(200).json(modifiedCourses);
})

router.post('/new', async (req: Request, res: Response) => {
  let decodedToken: IUser = await getPayloadFromToken(
    getTokenFromRequest(req) ?? ''
  )
  const username: string = decodedToken.username

  const firstName: string = decodedToken.firstName
  const lastName: string = decodedToken.lastName
  const profilePicture: string = decodedToken.profilePicture

  const materializedView = await MaterializedView.findOne({ username : username })
  if (materializedView) {
    materializedView.username = username;
    materializedView.firstName = firstName;
    materializedView.lastName = lastName;
    materializedView.profilePicture = profilePicture;

    await materializedView.save();
  }
  else {
    const newMaterializedView = MaterializedView.build({
      firstName: firstName,
      lastName: lastName,
      username: username,
      profilePicture: profilePicture,
    });

    await newMaterializedView.save()
  }

  const { name, description, price, categories, language }: CourseFormInputs = req.body

  const course = Course.build({
    name: name, 
    description: description, 
    price: price,
    categories: categories,
    language: language,
    creator: username,
    score: 3,
    access: [],
    classes: [],
    materials: [],
  });

  await course.save();

  return res.status(201).send('Course created!')
})

router.get('/list', async (req: Request, res: Response) => {
  let decodedToken: IUser = await getPayloadFromToken(
    getTokenFromRequest(req) ?? ''
  )
  const username: string = decodedToken.username
  const firstName: string = decodedToken.firstName
  const lastName: string = decodedToken.lastName
  const profilePicture: string = decodedToken.profilePicture

  const materializedView = await MaterializedView.findOne({ username : username })
  if (materializedView) {
    materializedView.username = username;
    materializedView.firstName = firstName;
    materializedView.lastName = lastName;
    materializedView.profilePicture = profilePicture;
    
    await materializedView.save();
  }
  else {
    const newMaterializedView = MaterializedView.build({
      firstName: firstName,
      lastName: lastName,
      username: username,
      profilePicture: profilePicture,
    });

    await newMaterializedView.save()
  }

  let filters: { [key: string]: any } = {};

  // Loop through query parameters
  Object.keys(req.query).forEach((key) => {
      if (key === 'categories' || key === 'otherListAttribute') {
        // @ts-ignore
        filters[key] = { $all: Array.isArray(req.query[key]) ? req.query[key].split(" ") : req.query[key].split(" ") };
      } else if (key === 'textQuery' || key === 'otherTypeQuery') {
        filters.$or = [
          // @ts-ignore
          { name: { $regex: new RegExp(req.query[key], 'i') } },
          // @ts-ignore
          { description: { $regex: new RegExp(req.query[key], 'i') } },
        ]
      }
      else {
        // If it's a single value attribute, directly assign the value
        filters[key] = req.query[key];
      }
  });

  const courses = await Course.find(filters);

  return res.status(200).json(courses);
})

router.put('/:courseId', async (req: Request, res: Response) => {
  let decodedToken: IUser = await getPayloadFromToken(
    getTokenFromRequest(req) ?? ''
  )
  const username: string = decodedToken.username

  const firstName: string = decodedToken.firstName
  const lastName: string = decodedToken.lastName
  const profilePicture: string = decodedToken.profilePicture

  const materializedView = await MaterializedView.findOne({ username : username })
  if (materializedView) {
    materializedView.username = username;
    materializedView.firstName = firstName;
    materializedView.lastName = lastName;
    materializedView.profilePicture = profilePicture;
    
    await materializedView.save();
  }
  else {
    const newMaterializedView = MaterializedView.build({
      firstName: firstName,
      lastName: lastName,
      username: username,
      profilePicture: profilePicture,
    });

    await newMaterializedView.save()
  }

  const { name, description, price, categories, language }: CourseFormInputs = req.body
  const courseId = req.params.courseId;

  let course
  try {
    course = await Course.findById(courseId)
  }
  catch (error) {
    return res.status(404).send("Course couldn't be found")
  }
  if (course) {
    course.name = name;
    course.description = description;
    course.price = price;
    course.categories = categories;
    course.language = language;
    course.creator = username;

    await course.save();

    return res.status(201).json(course)
  }
  else {
    return res.status(404).json(course)
  }
})

router.delete('/:courseId', async (req: Request, res: Response) => {
  let decodedToken: IUser = await getPayloadFromToken(
    getTokenFromRequest(req) ?? ''
  )
  const username: string = decodedToken.username

  const firstName: string = decodedToken.firstName
  const lastName: string = decodedToken.lastName
  const profilePicture: string = decodedToken.profilePicture

  const materializedView = await MaterializedView.findOne({ username : username })
  if (materializedView) {
    materializedView.username = username;
    materializedView.firstName = firstName;
    materializedView.lastName = lastName;
    materializedView.profilePicture = profilePicture;
    
    await materializedView.save();
  }
  else {
    const newMaterializedView = MaterializedView.build({
      firstName: firstName,
      lastName: lastName,
      username: username,
      profilePicture: profilePicture,
    });

    await newMaterializedView.save()
  }

  const courseId = req.params.courseId;
  
  let course
  try {
    course = await Course.findById(courseId)
  }
  catch (error) {
    return res.status(404).send("Course couldn't be found")
  }

  let classIds: string[] = []
  let materialIds: string[] = []

  if (course) {
      classIds = course.classes
      materialIds = course.materials
  }

  const data = {
      courseId,
      classIds,
      materialIds,
  }

  await sendMessage(
      'learning-microservice',
      'notificationDeleteCourse',
      process.env.API_KEY ?? '',
      JSON.stringify(data)
  )

  await Course.deleteOne({ _id : courseId })

  return res.status(200).send("Course deleted!")
})

router.get('/:courseId', async (req: Request, res: Response) => {
    let decodedToken: IUser = await getPayloadFromToken(
        getTokenFromRequest(req) ?? ''
    )
    const username: string = decodedToken.username

    const firstName: string = decodedToken.firstName
    const lastName: string = decodedToken.lastName
    const profilePicture: string = decodedToken.profilePicture
    
    const materializedView = await MaterializedView.findOne({ username : username })
    if (materializedView) {
      materializedView.username = username;
      materializedView.firstName = firstName;
      materializedView.lastName = lastName;
      materializedView.profilePicture = profilePicture;
      
      await materializedView.save();
    }
    else {
      const newMaterializedView = MaterializedView.build({
        firstName: firstName,
        lastName: lastName,
        username: username,
        profilePicture: profilePicture,
      });
  
      await newMaterializedView.save()
    }

    const courseId = req.params.courseId;
    let course
    try {
      course = await Course.findById(courseId)
    }
    catch (error) {
      return res.status(404).send("Course couldn't be found")
    }
    if (course)
      return res.status(200).json(course)
    else
      return res.status(404).json({ error: 'Course not found' });
})

router.get('/:courseId/classes', async (req: Request, res: Response) => {
  let decodedToken: IUser = await getPayloadFromToken(
    getTokenFromRequest(req) ?? ''
  )
  const username: string = decodedToken.username

  const firstName: string = decodedToken.firstName
  const lastName: string = decodedToken.lastName
  const profilePicture: string = decodedToken.profilePicture

  const materializedView = await MaterializedView.findOne({ username : username })
  if (materializedView) {
    materializedView.username = username;
    materializedView.firstName = firstName;
    materializedView.lastName = lastName;
    materializedView.profilePicture = profilePicture;
    
    await materializedView.save();
  }
  else {
    const newMaterializedView = MaterializedView.build({
      firstName: firstName,
      lastName: lastName,
      username: username,
      profilePicture: profilePicture,
    });

    await newMaterializedView.save()
  }

  const courseId = req.params.courseId;
  let course
  try {
    course = await Course.findById(courseId)
  }
  catch (error) {
    return res.status(404).send("Course couldn't be found")
  }
  if (course) {
    let classes = null
    //@ts-ignore
    await redisClient.exists(courseId + " classes").then(async (exists) => {
        if (exists === 1) {
          //@ts-ignore
          await redisClient.get(courseId + " classes").then((reply) => {
              classes = reply
          })
        } else {
            const message = JSON.stringify({
                courseId,
            })
            await sendMessage(
                'learning-microservice',
                'requestAppClassesAndMaterials',
                process.env.API_KEY ?? '',
                message
            )
        }
    })
    return res.status(200).json(classes)
  }
  else 
    return res.status(404).json({ error: 'Course not found' });
  })

router.get('/:courseId/materials', async (req: Request, res: Response) => {
  let decodedToken: IUser = await getPayloadFromToken(
    getTokenFromRequest(req) ?? ''
  )

  const username: string = decodedToken.username
  const firstName: string = decodedToken.firstName
  const lastName: string = decodedToken.lastName
  const profilePicture: string = decodedToken.profilePicture

  const materializedView = await MaterializedView.findOne({ username : username })
  if (materializedView) {
    materializedView.username = username;
    materializedView.firstName = firstName;
    materializedView.lastName = lastName;
    materializedView.profilePicture = profilePicture;
    
    await materializedView.save();
  }
  else {
    const newMaterializedView = MaterializedView.build({
      firstName: firstName,
      lastName: lastName,
      username: username,
      profilePicture: profilePicture,
    });

    await newMaterializedView.save()
  }

  const courseId = req.params.courseId;
  let course
  try {
    course = await Course.findById(courseId)
  }
  catch (error) {
    return res.status(404).send("Course couldn't be found")
  }
  if (course) {
    let materials = null
    //@ts-ignore
    await redisClient.exists(courseId + " materials").then(async (exists) => {
        if (exists === 1) {
          //@ts-ignore
          await redisClient.get(courseId + " materials").then((reply) => {
              materials = reply
          })
        } else {
            const message = JSON.stringify({
                courseId,
            })
            await sendMessage(
                'learning-microservice',
                'requestAppClassesAndMaterials',
                process.env.API_KEY ?? '',
                message
            )
        }
    })
    return res.status(200).json(materials)
  }
  else 
    return res.status(404).json({ error: 'Course not found' });
})
export default router