import { User } from './models/user';
import { Course } from './models/course';

function populateUsers() {
    User.build({
        name: 'Maria Doe',
        email: 'maria@example.com',
        password: 'maria123',
    }).save();
    
    User.build({
        name: 'Juan Doe',
        email: 'juan@example.com',
        password: 'juan123',
    }).save();

    const newUser = User.build({
        name: "Alejandro García",
        email: 'alejandro@garcia.com',
        password: 'ale123',
    });
    
    newUser.save()
    .then(creator => {
      // Now, create a new post and assign the user's ObjectId to the 'user' field
      const newCourse = Course.build({
        name: 'How to make Microservices',
        description: 'Learn how to make Microservices using MongoDB, Node.js, Express and React!',
        price: 30,
        creator: creator._id,
      });
  
      // Save the post to the database
      return newCourse.save();
    })
}

async function populateDB() {

    console.log('Populating DB...');
    
    if (process.env.NODE_ENV !== 'production') {

        User.collection.countDocuments().then((count) => {
            if (count === 0) {
                populateUsers()
            }
        })
    }

    console.log('Populated!');
}

export default populateDB;