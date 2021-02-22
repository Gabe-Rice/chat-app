

/* 
Functions:  

- addUser: track new user to add to specific rooms etc.
- removeUser: stop tracking user when user leaves
- getUser: get user data
- getUsersInRoom: get user data in specific room
*/

// Array to hold users
const users = [];

const addUser = ({id, username, room}) => {
    // Clean the data
    username = username.trim().toLowerCase(); //get rid of space and make lower
    room = room.trim().toLowerCase();

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username;
    })

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is already in use!'
        }
    }

    // Store user
    const user = {id, username, room};
    users.push(user) // push user obj to array
    return {user};
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id) // -1 if no match 0 or > if match found

    if (index !== -1) { // if match found
        return users.splice(index, 1)[0] // remove user at index and num items, return 1st element of array
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id);
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    return users.filter((user) => user.room === room);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}