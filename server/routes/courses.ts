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

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: API para gestionar cursos.
 */

/**
 * @swagger
 * definitions:
 *   CourseFormInputs:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       price:
 *         type: number
 *       categories:
 *         type: array
 *         items:
 *           type: string
 *       language:
 *         type: string
 */

/**
 * @swagger
 * /courses/check:
 *   get:
 *     summary: Verifica que el servicio de cursos esté funcionando correctamente.
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: El servicio de cursos está funcionando correctamente.
 *         content:
 *           application/json:
 *             example:
 *               message: 'The courses service is working properly!'
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/check', async (req: Request, res: Response) => {
  return res.status(200).json({ message: 'The courses service is working properly!' });
});

/**
 * @swagger
 * /courses/categories:
 *   get:
 *     summary: Obtiene recuentos de categorías para los cursos.
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Recuentos de categorías recuperados exitosamente.
 *         content:
 *           application/json:
 *             example:
 *               category1: 5
 *               category2: 10
 *               category3: 7
 *       500:
 *         description: Error interno del servidor.
 */
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

/**
 * @swagger
 * /courses/best:
 *   get:
 *     summary: Obtiene los mejores cursos ordenados por puntuación.
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Mejores cursos recuperados exitosamente.
 *         content:
 *           application/json:
 *             example:
 *               - name: 'Curso 1'
 *                 description: 'Descripción del curso 1'
 *                 price: 19.99
 *                 categories: ['Categoria1', 'Categoria2']
 *                 language: 'Español'
 *                 creator: 'Usuario1'
 *                 score: 4.5
 *               - name: 'Curso 2'
 *                 description: 'Descripción del curso 2'
 *                 price: 29.99
 *                 categories: ['Categoria3', 'Categoria4']
 *                 language: 'Inglés'
 *                 creator: 'Usuario2'
 *                 score: 4.8
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/best', async (req: Request, res: Response) => {
  const courses = await Course.find().sort({ score: -1 }).limit(6);

    const modifiedCourses = await Promise.all(
      courses.map(async (course) => {
        const user = await MaterializedView.findOne({ username: course.creator });
        if (user) {
          return {
            ...course.toObject(),
            creator: user.firstName + ' ' + user.lastName,
          };
        } else {
          return {
            course,
          };
        }
      })
    );

    return res.status(200).json(modifiedCourses);
})

/**
 * @swagger
 * /courses/new:
 *   post:
 *     summary: Crea un nuevo curso.
 *     tags: [Courses]
 *     requestBody:
 *       description: Datos del nuevo curso.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CourseFormInputs'
 *     responses:
 *       201:
 *         description: Curso creado exitosamente.
 *       400:
 *         description: Error de validación al guardar.
 *       500:
 *         description: Error interno del servidor.
 */
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
/**
 * @swagger
 * /courses/list:
 *   get:
 *     summary: Obtiene la lista de cursos según los filtros proporcionados.
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Lista de cursos recuperada exitosamente.
 *         content:
 *           application/json:
 *             example:
 *               - name: 'Curso 1'
 *                 description: 'Descripción del curso 1'
 *                 price: 19.99
 *                 categories: ['Categoria1', 'Categoria2']
 *                 language: 'Español'
 *                 creator: 'Usuario1'
 *                 score: 4.5
 *               - name: 'Curso 2'
 *                 description: 'Descripción del curso 2'
 *                 price: 29.99
 *                 categories: ['Categoria3', 'Categoria4']
 *                 language: 'Inglés'
 *                 creator: 'Usuario2'
 *                 score: 4.8
 *       500:
 *         description: Error interno del servidor.
 */
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
/**
 * @swagger
 * /courses/{courseId}:
 *   put:
 *     summary: Actualiza un curso existente.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         description: ID del curso a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Nuevos datos del curso.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/CourseFormInputs'
 *     responses:
 *       201:
 *         description: Curso actualizado exitosamente.
 *         content:
 *           application/json:
 *             example:
 *               name: 'Nuevo Curso'
 *               description: 'Nueva descripción del curso'
 *               price: 24.99
 *               categories: ['NuevaCategoria1', 'NuevaCategoria2']
 *               language: 'Inglés'
 *               creator: 'UsuarioActualizado'
 *               score: 4.2
 *       404:
 *         description: Curso no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
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
/**
 * @swagger
 * /courses/{courseId}:
 *   delete:
 *     summary: Elimina un curso existente.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         description: ID del curso a eliminar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso eliminado exitosamente.
 *       404:
 *         description: Curso no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
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
/**
 * @swagger
 * /courses/{courseId}/classes:
 *   get:
 *     summary: Obtiene las clases de un curso específico.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         description: ID del curso del cual obtener las clases.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clases obtenidas exitosamente.
 *         content:
 *           application/json:
 *             example:
 *               - _id: 'Clase1'
 *                 title: 'Clase de Introducción'
 *                 description: 'Descripción de la clase de introducción.'
 *                 videoUrl: 'https://www.youtube.com/watch?v=1234567890'
 *               - _id: 'Clase2'
 *                 title: 'Segunda Clase'
 *                 description: 'Descripción de la segunda clase.'
 *                 videoUrl: 'https://www.youtube.com/watch?v=0987654321'
 *       404:
 *         description: Curso no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
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