import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Course } from '../db/models/course'
import index from '../test_index';

let mongod: any;

const app = index.app

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7ImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSIsInVzZXJuYW1lIjoiam9obmRvZTEyMyIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJwcm9maWxlUGljdHVyZSI6Imh0dHBzOi8vc3RvcmFnZS5nb29nbGVhcGlzLmNvbS9maXNnNC11c2VyLWltYWdlcy1idWNrZXQvZGVmYXVsdC11c2VyLmpwZyIsImNvaW5zQW1vdW50IjowLCJyb2xlIjoiVVNFUiIsInBsYW4iOiJQUk8ifSwiaWF0IjoxNzA2MDk1OTU1LCJleHAiOjE3MDYxODIzNTV9.uy7VYlJpQ66ZowMRjx0LpKPpn9G2EV8ezRsh3ktIdGY";

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

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  await mongoose.connect(mongoUri);

  await setupCourses();
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
  it('should return a message for /check endpoint', async () => {
    const response = await request(app).get('/v1/courses/check').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('The courses service is working properly!');
  });

  it('should return category counts for /categories endpoint', async () => {
    const response = await request(app).get('/v1/courses/categories').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.any(Object));
    // Add more expectations based on your data
  });

  it('should return the best courses for /best endpoint', async () => {
    const response = await request(app).get('/v1/courses/best').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    // Add more expectations based on your data
  });

  it('should create a new course for /new endpoint', async () => {
    const response = await request(app)
      .post('/v1/courses/new').set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Course',
        description: 'A new course',
        price: 19.99,
        categories: ['Category1', 'Category2'],
        language: 'English',
      });
    expect(response.status).toBe(201);
    expect(response.text).toBe('Course created!');
    // Add more expectations based on your data
  });

  it('should list courses based on filters for /list endpoint', async () => {
    const response = await request(app).get('/v1/courses/list').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    // Add more expectations based on your data
  });

  it('should get details of a course for /:courseId endpoint', async () => {
    const course = await Course.find({name : 'Sample Course 1'}) as any

    const response = await request(app).get(`/v1/courses/${course[0]._id}`).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body._id).toEqual(course[0]._id.toString());
    // Add more expectations based on your data
  });
});

it('should update a course for /:courseId endpoint', async () => {
  const newCourse = {
    name: 'Updated Course',
    description: 'An updated course',
    price: 24.99,
    categories: ['UpdatedCategory'],
    language: 'Spanish',
  };
  const course = await Course.find({name : 'Sample Course 1'}) as any

  const response = await request(app)
    .put(`/v1/courses/${course[0]._id}`).set('Authorization', `Bearer ${token}`)
    .send(newCourse);
  expect(response.status).toBe(201);
  expect(response.body).toEqual(expect.objectContaining(newCourse));
  // Add more expectations based on your data
});

it('should delete a course for /:courseId endpoint', async () => {
  const course = await Course.find({name : 'Sample Course 2'}) as any

  const response = await request(app).delete(`/v1/courses/${course[0]._id}`).set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.text).toBe('Course deleted!');
});

  it('should return an error for /new endpoint if user attempts to create a course with a word for its price', async () => {
    const response = await request(app)
      .post('/v1/courses/new')
      .send({
        name: 'New Course',
        description: 'A new course',
        price: "hello world",
        categories: ['Category1', 'Category2'],
        language: 'English',
      });
    expect(response.status).toBe(401);
    // Add more expectations based on your error handling
  });
  
  it('should return an error for /:courseId endpoint if the course ID is invalid', async () => {
    const response = await request(app).get('/v1/courses/invalidCourseId').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
    // Add more expectations based on your error handling
  });

  it('should return an error for /:courseId endpoint if the course ID is invalid', async () => {
    const response = await request(app)
      .put('/v1/courses/invalidCourseId')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Course',
        description: 'An updated course',
        price: 24.99,
        categories: ['UpdatedCategory'],
        language: 'Spanish',
      });
    expect(response.status).toBe(404);
    // Add more expectations based on your error handling
  });

  it('should return an error for /:courseId endpoint if the course ID is invalid', async () => {
    const response = await request(app).delete('/v1/courses/invalidCourseId').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
    // Add more expectations based on your error handling
  });
