debugger
import request from 'supertest';
import { Review, IReview } from '../db/models/review'
import { describe } from "node:test";
import mongoose from 'mongoose';

const BASE_URL = "http://localhost:8000/";

const TEST_URLS = {
    reviews: 'api/v1/reviews',
    newReview: 'api/v1/reviews/new',
    reviewById: 'api/v1/reviews/:id',
    deleteReview: 'api/v1/reviews/remove/:id',
    reviewsByCourse: 'api/v1/reviews/courses/:id',
    reviewsByUser: 'api/v1/reviews/users/:id'
}

const TEST_USER = {
    name: 'Maria Doe',
    email: 'maria@example.com',
    password: 'maria123',
}
const TEST_COURSE = {
    name: "Curso sobre como hacer tests.",
    description: "Introducción sobre como hacer tests - FIS",
    price: 100,
    creator: TEST_USER,
}

const TEST_MATERIAL = {
    title: "Transparencias sobre testing en microservicios",
    description: "Transparencias sobre como hacer testing en microservicios - FIS",
    price: 100,
    currency: 'USD',
    author: "David",
    purchasers: [],
    file: "string",
    type: 'book'
}

const TEST_REVIEW_COURSE = {
    title: "Muy buen curso sobre testing",
    description: "Me ha gustado mucho",
    score: 5,
    course: null,
    creator: null,
    material: null,
}

const TEST_REVIEW_USER = {
    title: "Muy buena profesora",
    description: "Me ha gustado mucho y esto es un test",
    score: 5,
    course: null,
    creator: null,
    material: null,
}

const TEST_REVIEW_MATERIAL  = {
    title: "Muy buen material sobre testing",
    description: "Me ha gustado mucho",
    score: 5,
    course: null,
    creator: null,
    material: null,
}

//Test 1 - Obtener todas las reviews


describe(`GET ${TEST_URLS.reviews}`, () => {
  it('Obtiene todas las reseñas: 200 OK', async () => {
    try {
        const response = await request(BASE_URL).get(TEST_URLS.reviews);
        console.log("Se obtienen todas las reseñas: " + JSON.stringify(response.body, null, 2));
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    } catch (error) {
      console.error(error);
      throw error; // Re-lanza el error para que Jest lo capture
    }
  });
});

//Test 2 - Obtener una review por su id


describe(`GET ${TEST_URLS.reviewById}`, () => {
    let reviewId: string;

    // Antes de todas las pruebas, crea una revisión de ejemplo y guarda su ID
    beforeAll(async () => {
        const response = await request(BASE_URL).post(TEST_URLS.newReview).send(TEST_REVIEW_USER);
        reviewId = response.body._id;
        console.log("Id creado: "+ reviewId);
    });
    

    // Después de todas las pruebas, elimina la revisión de ejemplo (o realiza limpieza)
    afterAll(async () => {
        await request(BASE_URL).delete(TEST_URLS.deleteReview.replace(':id', reviewId));
    });

    it('debería obtener una revisión por su ID', async () => {
        // Realiza una solicitud GET para obtener la revisión por su ID
        
        const response = await request(BASE_URL).get(TEST_URLS.reviewById.replace(':id', reviewId));
        console.log(response.body);
        // Verifica que la respuesta sea exitosa (código de estado 200)
        expect(response.status).toBe(200);

        // Verifica que el cuerpo de la respuesta contenga la revisión
        expect(response.body).toHaveProperty('_id', reviewId);

    });

    it('debería devolver 500 si la revisión no se encuentra', async () => {
        // Proporciona un ID que no existe para obtener una revisión
        const nonExistentReviewId = '5f18b6a38d03c92d54833333'; // ID no existente

        // Realiza una solicitud GET para obtener la revisión por un ID no existente
        const response = await request(BASE_URL).get(TEST_URLS.reviewById.replace(':id', nonExistentReviewId));

        // Verifica que la respuesta sea 404 si la revisión no se encuentra
        expect(response.status).toBe(404);
        // Puedes verificar el mensaje de error u otros detalles según tu implementación
    });
})

// Test 3 - Crear una nueva revisión

describe(`POST ${TEST_URLS.newReview}`, () => {
  let reviewId: string;

  // Después de cada prueba, elimina la revisión creada (o realiza limpieza)
  afterEach(async () => {
    if (reviewId) {
      await request(BASE_URL).delete(TEST_URLS.deleteReview.replace(':id', reviewId));
    }
  });

  it('debería crear una nueva revisión: 201 Created', async () => {
    try {
      // Realiza una solicitud POST para crear una nueva revisión
      const response = await request(BASE_URL).post(TEST_URLS.newReview).send(TEST_REVIEW_COURSE);

      // Verifica que la respuesta sea exitosa (código de estado 201)
      expect(response.status).toBe(201);

      // Verifica que el cuerpo de la respuesta tenga el ID de la nueva revisión
      expect(response.body).toHaveProperty('_id');
      reviewId = response.body._id; // Guarda el ID para la limpieza después de cada prueba

      // Puedes realizar más verificaciones según tu implementación
    } catch (error) {
      console.error(error);
      throw error; // Re-lanza el error para que Jest lo capture
    }
  });

  it('debería devolver 400 si la solicitud es incorrecta', async () => {
    // Proporciona datos incorrectos o incompletos para la creación de revisión
    const invalidReviewData = {
      // Datos inválidos o incompletos aquí
    };

    // Realiza una solicitud POST con datos incorrectos o incompletos
    const response = await request(BASE_URL).post(TEST_URLS.newReview).send(invalidReviewData);

    // Verifica que la respuesta sea 400 si la solicitud es incorrecta
    expect(response.status).toBe(400);
    // Puedes verificar el mensaje de error u otros detalles según tu implementación
  });
});

// Test 4 - Eliminar una revisión por su ID

describe(`DELETE ${TEST_URLS.deleteReview}`, () => {
  let reviewId: string;

  // Antes de cada prueba, crea una revisión de ejemplo y guarda su ID
  beforeEach(async () => {
    const response = await request(BASE_URL).post(TEST_URLS.newReview).send(TEST_REVIEW_USER);
    reviewId = response.body._id;
  });

  it('debería eliminar una revisión por su ID: 204 No Content', async () => {
    try {
      // Realiza una solicitud DELETE para eliminar la revisión por su ID
      const response = await request(BASE_URL).delete(TEST_URLS.deleteReview.replace(':id', reviewId));

      // Verifica que la respuesta sea exitosa (código de estado 204)
      expect(response.status).toBe(204);

      // Intenta obtener la revisión después de la eliminación y verifica que no existe
      const verifyResponse = await request(BASE_URL).get(TEST_URLS.reviewById.replace(':id', reviewId));
      expect(verifyResponse.status).toBe(404);
    } catch (error) {
      console.error(error);
      throw error; // Re-lanza el error para que Jest lo capture
    }
  });

  it('debería devolver 404 si la revisión no se encuentra: 404 Not Found', async () => {
    // Proporciona un ID que no existe para eliminar una revisión
    const nonExistentReviewId = '5f18b6a38d03c92d54833333'; // ID no existente

    // Realiza una solicitud DELETE para eliminar una revisión por un ID no existente
    const response = await request(BASE_URL).delete(TEST_URLS.deleteReview.replace(':id', nonExistentReviewId));

    // Verifica que la respuesta sea 404 si la revisión no se encuentra
    expect(response.status).toBe(404);
    // Puedes verificar el mensaje de error u otros detalles según tu implementación
  });
});
