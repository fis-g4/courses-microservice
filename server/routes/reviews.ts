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

    // Verificar si el curso existe en la base de datos
    if (req.body.course) {
      const courseExists = await Course.exists({ _id: req.body.course });
      if (!courseExists) {
        return res.status(404).send('El curso no existe en la base de datos');
      }
    }

    // Verificar si el creador (usuario) existe en la base de datos
    if (req.body.creator) {
      const userExists = await User.exists({ _id: req.body.creator });
      if (!userExists) {
        return res.status(404).send('El usuario no existe en la base de datos');
      }
    }

    // Verificar si el material existe en la base de datos
    if (req.body.material) {
      const materialExists = await Material.exists({ _id: req.body.material });
      if (!materialExists) {
        return res.status(404).send('El material no existe en la base de datos');
      }
    }
    // Si todas las validaciones son exitosas, construir y guardar la revisión
    const review = Review.build({
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

      let total_score = 0
      let total_reviews = 0
      for (let review of reviews) {
          total_score += review.score
          total_reviews += 1
      }
      if (total_reviews > 0) {
        course.score = total_score / total_reviews;
      }
      await course.save();
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

  // Verificar si el curso existe en la base de datos
  if (req.body.course) {
    const courseExists = await Course.exists({ _id: req.body.course });
    if (!courseExists) {
      return res.status(404).send('El curso no existe en la base de datos');
    }
  }

  // Verificar si el creador (usuario) existe en la base de datos
  if (req.body.creator) {
    const userExists = await User.exists({ _id: req.body.creator });
    if (!userExists) {
      return res.status(404).send('El usuario no existe en la base de datos');
    }
  }

  // Verificar si el material existe en la base de datos
  if (req.body.material) {
    const materialExists = await Material.exists({ _id: req.body.material });
    if (!materialExists) {
      return res.status(404).send('El material no existe en la base de datos');
    }
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

      let total_score = 0
      let total_reviews = 0
      for (let review of reviews) {
          total_score += review.score
          total_reviews += 1
      }
      if (total_reviews > 0) {
        course.score = total_score / total_reviews;
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
    const reviews = await Review.find({ course: req.params.courseId });
    res.status(200).send(reviews);
} catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener las reseñas por curso');
}
});

//Buscar reseñas por el id del usuario (profesor)
router.get('/user/:userId', async (req, res) => {
try {
    const reviews = await Review.find({ user: req.params.userId });
    res.status(200).send(reviews);
} catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener las reseñas por usuario');
}
});



export default router

