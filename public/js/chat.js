const socket = io()

const $submitForm = document.querySelector('#submit-form')
const $submitFormInput = $submitForm.querySelector('input')
const $submitFormButton = $submitForm.querySelector('button')

const $sendLocationBtn = document.querySelector('#send-location')


const $messages = document.querySelector('#messages')

// Tempalates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML




// Options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true } )


const autoScroll = () => {
    // get new message
    const $newMessage = $messages.lastElementChild

    // Height of last new message

    const newMessageStyles = getComputedStyle($newMessage)

    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    console.log(newMessageMargin)

    // Visible Height
    const VisibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight


    //How far have i scrolled
    const scrollOffset = $messages.scrollTop + VisibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset )  {
        $messages.scrollTop = $messages.scrollHeight
    }


}




socket.on('message', (msg) => {
    console.log(msg)

    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeEnd', html)

    autoScroll()
})



socket.on('locationMessage', (message) => {
    console.log(message)

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        URL: message.URL,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)

    autoScroll()
})


socket.on('roomData', ( {room, users} ) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})


$submitForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const msg = e.target.elements.message.value
    $submitFormButton.setAttribute('disabled', 'disabled')
    

    socket.emit('sendMessage', msg, (error) => {
        $submitFormButton.removeAttribute('disabled')
        $submitFormInput.value = ''
        $submitFormInput.focus()
        
        if (error) {
           return console.log(error)
        }
        console.log(`The message was delivered !`)
    })
})


$sendLocationBtn.addEventListener('click', () => {

    $sendLocationBtn.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by the browser')
    }

    navigator.geolocation.getCurrentPosition( (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude

        socket.emit('sendLocation', {lat, lon}, (error) => {
            $sendLocationBtn.removeAttribute('disabled')

            if (error) return console.log(error)
            
            console.log('Location share success !')
        })
    })

})


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
} )

