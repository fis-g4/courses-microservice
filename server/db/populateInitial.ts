import { PlanType, User, UserRole } from './models/user';
import { Review } from './models/review';
import { Course } from './models/course';

function populateUsers() {
    User.build({
        firstName: 'Maria',
        lastName: 'Doe',
        username: 'maria_username',
        password: 'maria123',
        email: 'maria@example.com',
        profilePicture: 'maria.jpg',
        coinsAmount: 100,
        plan: PlanType.BASIC,
        role: UserRole.USER,
    }).save();
    
    User.build({
        firstName: 'Juan',
        lastName: 'Doe',
        username: 'juan_username',
        password: 'juan123',
        email: 'juan@example.com',
        profilePicture: 'juan.jpg',
        coinsAmount: 150,
        plan: PlanType.ADVANCED,
        role: UserRole.ADMIN,
    }).save();
    
    // Construye un nuevo usuario sin guardarlo inmediatamente
    const newUser = User.build({
        firstName: 'Alejandro',
        lastName: 'García',
        username: 'alejandro_username',
        password: 'ale123',
        email: 'alejandro@garcia.com',
        profilePicture: 'alejandro.jpg',
        coinsAmount: 200,
        plan: PlanType.PRO,
        role: UserRole.USER,
    });
    
    newUser.save()
    .then(creator => {
      // Now, create a new post and assign the user's ObjectId to the 'user' field
      const newCourse = new Course({
        name: 'How to make Microservices',
        description: 'Learn how to make Microservices using MongoDB, Node.js, Express.js and React!',
        price: 30,
        categories: [
            'MongoDB', 'Node.js', 'Express.js', 'React', 'Microservices', 'Software Engineering', 'IT', 
            'Computer Science',
        ],
        language: 'English',
        creator: creator._id,
      });
  
      // Save the post to the database
      return newCourse.save();
    })
}

function populateReviews() {
    Review.build({
        title: "Muy buena profesora",
        description: "Me ha gustado mucho",
        score: 5,
        course: null,
        creator: null,
        material: null,     
    }).save();
}

async function populateDB() {

    console.log('Populating DB...');
    
    if (process.env.NODE_ENV !== 'production' && process.env.npm_config_run_tests!== 'true') {

        User.collection.countDocuments().then((count) => {
            if (count === 0) {
                populateUsers()
                populateReviews()
            }
        })
    }else if(process.env.npm_config_run_tests=== 'true'){
        
    }

    console.log('Populated!');
}

export default populateDB;