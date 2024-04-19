import {createUser, getAllUsers} from './data/user.js'
import {dbConnection, closeConnection} from './config/mongoConnection.js';
const db = await dbConnection();
await db.dropDatabase();

try {
    await createUser( 'Jone', 'Doe', 'john.doe@example.com', 'johndoe', 'mySecurePassword123'); 
    await createUser( 'Jone', 'Doe', 'john.doe@example.com', 'johndoe1', 'mySecurePassword123'); 
    await createUser( 'Jone', 'Doe', 'john.doe@example.com', 'johndoe2', 'mySecurePassword123'); 
} catch(e) {
    console.log(e)
}

try {   
    console.log(await getAllUsers())
} catch(e) {
    console.log(e)
}

await closeConnection();