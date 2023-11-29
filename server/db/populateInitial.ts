import { User } from './models/user';

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