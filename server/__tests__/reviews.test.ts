import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Course } from '../db/models/course'
import { Review } from '../db/models/review'
import index from '../test_index';

let mongod: any;

const app = index.app

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7ImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSAyIiwidXNlcm5hbWUiOiJqb2huZG9lNDU4IiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlNC5jb20iLCJwcm9maWxlUGljdHVyZSI6Imh0dHBzOi8vc3RvcmFnZS5nb29nbGVhcGlzLmNvbS9maXNnNC11c2VyLWltYWdlcy1idWNrZXQvZGVmYXVsdC11c2VyLmpwZyIsImNvaW5zQW1vdW50IjowLCJyb2xlIjoiVVNFUiIsInBsYW4iOiJQUk8ifSwiaWF0IjoxNzA2MDA4NDYyLCJleHAiOjE3MDYwOTQ4NjJ9.gq3kzKoJK1vidlTbCDJArnMQUPKCNl_JoDiguLqgkeU';

const setupCourses = async () => {
  const sampleCourses = [
      {
        name: 'Sample Course 1',
        description: 'Description of Sample Course 1',
        price: 29.99,
        categories: ['Category1', 'Category2'],
        language: 'English',
        creator: 'example user'
      },
      {
        name: 'Sample Course 2',
        description: 'Description of Sample Course 1',
        price: 29.99,
        categories: ['Category1', 'Category2'],
        language: 'English',
        creator: 'example user'
      },
    // Add more sample courses as needed
  ];

  await Course.insertMany(sampleCourses);
};

const setupReviews = async () => {
    const course1 = await Course.find({name : 'Sample Course 1'}) as any
    const course2 = await Course.find({name : 'Sample Course 2'}) as any

    const sampleReviews = [
        {
          type: 'COURSE',
          user: '',
          creator: 'example user',
          title: 'example review 1',
          description: 'example description',
          rating: 4,
          course: course1[0]._id,
          material: ''
        },
        {
          type: 'COURSE',
          user: '',
          creator: 'example user 2',
          title: 'example review 2',
          description: 'example description',
          rating: 4,
          course: course2[0]._id,
          material: ''
        },
    ];
  
    await Review.insertMany(sampleReviews);
  };

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  await mongoose.connect(mongoUri);

  await setupCourses();
  await setupReviews();
});

afterAll(async () => {
  const server = index.server
  if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('Server closed');
  }
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Endpoint Tests', () => {

  it('should create a new review for /new endpoint', async () => {
    const course1 = await Course.find({name : 'Sample Course 1'}) as any
    const response = await request(app)
      .post('/v1/reviews/new').set('Authorization', `Bearer ${token}`)
      .send({
        type: 'COURSE',
        user: '',
        title: 'example review 3',
        description: 'example description',
        rating: 4,
        course: course1[0]._id,
        material: ''
      });
    expect(response.status).toBe(201);
    // Add more expectations based on your data
  });

  it('should list reviews for / endpoint', async () => {
    const response = await request(app).get('/v1/reviews').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    // Add more expectations based on your data
  });

  it('should get details of a course for /:id endpoint', async () => {
    const review = await Review.find({title : 'example review 1'}) as any

    const response = await request(app).get(`/v1/reviews/${review[0]._id}`).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body._id).toEqual(review[0]._id.toString());
    // Add more expectations based on your data
  });
});

it('should update a review for /:id endpoint', async () => {
  const course1 = await Course.find({name : 'Sample Course 1'}) as any
  const newReview = {
    type: 'COURSE',
    user: '',
    title: 'updated example review',
    description: 'example description',
    rating: 4,
    course: course1[0]._id,
    material: ''
  };
  const review = await Review.find({title : 'example review 1'}) as any

  const response = await request(app)
    .put(`/v1/reviews/${review[0]._id}`).set('Authorization', `Bearer ${token}`)
    .send(newReview);
  expect(response.status).toBe(201);
  expect(response.body.title).toEqual(newReview.title.toString());
  // Add more expectations based on your data
});

it('should delete a review for /:id endpoint', async () => {
  const review = await Review.find({title : 'example review 2'}) as any

  const response = await request(app).delete(`/v1/reviews/remove/${review[0]._id}`).set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(204);
});


it('should return an error for /new endpoint if the request is missing required fields', async () => {
  const response = await request(app)
    .post('/v1/reviews/new').set('Authorization', `Bearer ${token}`)
    .send({
      // Missing required fields
    });
  expect(response.status).toBe(400);
  // Add more expectations based on your error handling
});

it('should return an error for / endpoint if user is not authenticated', async () => {
  const response = await request(app).get('/v1/reviews');
  expect(response.status).toBe(401);
  // Add more expectations based on your error handling
});

it('should return an error for /:id endpoint if the review ID is invalid', async () => {
  const response = await request(app).get('/v1/reviews/invalidReviewId').set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(404);
  // Add more expectations based on your error handling
});

it('should return an error for /:id endpoint if the review ID is invalid', async () => {
  const response = await request(app)
    .put('/v1/reviews/invalidReviewId').set('Authorization', `Bearer ${token}`)
    .send({
      // Valid update data
    });
  expect(response.status).toBe(404);
  // Add more expectations based on your error handling
});

it('should return an error for /remove/:id endpoint if the review ID is invalid', async () => {
  const response = await request(app).delete('/v1/reviews/remove/invalidReviewId').set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(404);
  // Add more expectations based on your error handling
});