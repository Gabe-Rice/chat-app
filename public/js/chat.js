// client side script

const socket = io();  // from socket.io ref in .html

//Form, input and button elements: ($ is convention to show element is from DOM)
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');// loc to render template

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML; //gets access to html in elements
const locationMsgTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options:  
// get username and room params/querystring from URL, ignoreQueryPrefix removes ? from location string url
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});


// Logic to autoscroll when scroll bar at bottom, no scroll when looking at old data
const autoscroll = () => {
    // get new message elmement
    const $newMessage = $messages.lastElementChild

    // get height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight // height of viewing window
    
    // Height of messages container
    const containerHeight = $messages.scrollHeight // height of entire window

    // Distance scrolled 
    const scrollOffset = $messages.scrollTop + visibleHeight // distance from top of cont to top of scroll bar

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (msgFromServer) => { // gets messages from server, must be called 'message'
    console.log(msgFromServer);
    const html = Mustache.render(messageTemplate, {
        message: msgFromServer.text, //get data from server obj
        createdAt: moment(msgFromServer.createdAt).format('h:mm a'),//get time using moment
        username: msgFromServer.username
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('locationMessage', (locMsgFromServer) => {
    console.log(locMsgFromServer);
    const html = Mustache.render(locationMsgTemplate, {
        locationURL: locMsgFromServer.url,
        createdAt: moment(locMsgFromServer.createdAt).format('h:mm a'),
        username: locMsgFromServer.username
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent page clearing

    // disable send button to avoid sending twice
    $messageFormButton.setAttribute('disabled', 'disabled');

    // get input from index.html (name="message"), makes more secure
    const message = e.target.elements.message.value; 

    // send message to server with acknowledgement, enable form to send
    socket.emit('sendMessage', message, (error) => {
        // re-enable send button
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = ''; // reset input
        $messageFormInput.focus(); // put cursor back in input field

        if(error) {
            return console.log(error);
        }
    }) 
})

// 'send location' button:
$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not support by this browser.');
    }

    // disable send button while sending loc
    $sendLocationButton.setAttribute('disabled', 'disabled'); 

    // send lat and long to server
    navigator.geolocation.getCurrentPosition((position) => {
        const location = {lat: position.coords.latitude, long: position.coords.longitude};
        
        socket.emit('sendLocation', location, () => {
            console.log('Location shared!');
            $sendLocationButton.removeAttribute('disabled'); // enable send button
        }); 
    })
})

// error function is acknowledgement 
socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error);
        location.href = '/' //redirect to root/join page
    }
});