import express, {Request, Response} from 'express';
import { Review } from '../db/models/review';
import { Material } from '../db/models/material';
import mongoose from 'mongoose';
import { User } from '../db/models/user';
import { Course } from '../db/models/course';
import {
    IUser,
    getPayloadFromToken,
    getTokenFromRequest,
} from '../utils/jwtUtils'


const router = express.Router()


//Ruta para crear las reviews, body: title, description, score, material, user, course
router.post('/new', async (req, res) => {
  console.log("Se empieza a procesar el post");
  try {
    let decodedToken: IUser = await getPayloadFromToken(
      getTokenFromRequest(req) ?? ''
    )
    const username: string = decodedToken.username
    // Verificar que el cuerpo de la solicitud no esté vacío
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send('Cuerpo de solicitud vacío o sin campos requeridos');
    }

    // Validar la existencia del curso
    if (req.body.type === 'COURSE' && req.body.course && !mongoose.isValidObjectId(req.body.course)) {
      return res.status(400).send('ID de curso no válido');
    }

    // Validar la existencia del creador (usuario)
    if (req.body.creator === null || req.body.creator === '' ) {
      return res.status(400).send('ID de usuario no válido');
    }

    // Validar la existencia del material
    if (req.body.type === 'MATERIAL' && req.body.material && !mongoose.isValidObjectId(req.body.material)) {
      return res.status(400).send('ID de material no válido');
    }

    // Si todas las validaciones son exitosas, construir y guardar la revisión
    const review = Review.build({
      type: req.body.type,
      user: req.body.user,
      title: req.body.title, 
      description: req.body.description, 
      rating: req.body.rating,
      course: req.body.course,
      material: req.body.material,
      creator: username
    });
    await review.save();
    if(req.body.type === 'COURSE'){
      const courseId = req.body.course;
      const course = await Course.findById(courseId);
      if (course) {
        const reviews = await Review.find({ course : courseId })

        let total_rating = 0
        let total_reviews = 0
        for (let review of reviews) {
            total_rating += review.rating
            total_reviews += 1
        }
        if (total_reviews > 0) {
          course.score = total_rating / total_reviews;
        }
        await course.save();
    }
    }
    
    res.status(201).send(review);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear la revisión');
  }
});

  

//Obtener todas las reseñas
router.get('/', async (req, res) => {
try {
    const reviews = await Review.find({});
    res.status(200).send(reviews);
} catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener las reseñas');
}
});

//Obtener una reseña por su id
router.get('/:id', async (req, res) => {
try {
    console.log("El id es: "+req.params.id);
    const review = await Review.findById(req.params.id);
    if (!review) {
    return res.status(404).send('Reseña no encontrada');
    }
    res.status(200).send(review);
} catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener la reseña');
}
});

//Actualizar una reseña por su id

router.put('/:id', async (req, res) => {
try {
  let decodedToken: IUser = await getPayloadFromToken(
    getTokenFromRequest(req) ?? ''
  )
  const username: string = decodedToken.username
  // Validar la existencia del curso
  if (req.body.course && !mongoose.isValidObjectId(req.body.course)) {
    return res.status(400).send('ID de curso no válido');
  }

  // Validar la existencia del creador (usuario)
  if (req.body.creator && !mongoose.isValidObjectId(req.body.creator)) {
    return res.status(400).send('ID de usuario no válido');
  }

  // Validar la existencia del material
  if (req.body.material && !mongoose.isValidObjectId(req.body.material)) {
    return res.status(400).send('ID de material no válido');
  }
 
    const review = await Review.findById(req.params.id);
    if (!review) {
    return res.status(404).send('Reseña no encontrada');
    }

    // Actualizar las propiedades según lo que venga en el cuerpo de la solicitud

    review.set({
      title: req.body.title, 
      description: req.body.description, 
      score: req.body.score,
      course: req.body.course,
      material: req.body.material,
      creator: username
    });
    await review.save();
    const courseId = req.body.course;
    const course = await Course.findById(courseId);
    if (course) {
      const reviews = await Review.find({ course : courseId })

      let total_rating = 0
      let total_reviews = 0
      for (let review of reviews) {
          total_rating += review.rating
          total_reviews += 1
      }
      if (total_reviews > 0) {
        course.score = total_rating / total_reviews;
      }
      await course.save();
    }

    res.status(200).send(review);
} catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar la reseña');
}
});
  
//Elimina una reseña por su id

router.delete('/remove/:id', async (req, res) => {
try {
    const review = await Review.findById(req.params.id);
    if (!review) {
    return res.status(404).send('Reseña no encontrada');
    }

    await review.deleteOne();
    res.status(204).send();
} catch (error) {
    console.error(error);
    res.status(500).send('Error al eliminar la revisión');
}
});

//Buscar reseñas por el id del curso

router.get('/course/:courseId', async (req, res) => {
try {
    console.log('Populating DB...');
    const reviews = await Review.find({ course: req.params.courseId });
    res.status(200).send(reviews);
} catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener las reseñas por curso');
}
});

//Buscar reseñas por el id del usuario (profesor)
router.get('/user/:username', async (req, res) => {
try {
    console.log("Se buscan usuarios");
    const reviews = await Review.find({ user: req.params.username });
    res.status(200).send(reviews);
} catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener las reseñas por usuario');
}
});

//Buscar reseñas por el id del usuario (creador reseña)
router.get('/creator/:username', async (req, res) => {
  try {
      console.log("Se buscan creadores");
      const reviews = await Review.find({ creator: req.params.username });
      res.status(200).send(reviews);
  } catch (error) {
      console.error(error);
      res.status(500).send('Error al obtener las reseñas por creador');
  }
  });
  

export default router