// reservation.js - Hotel Booking System

// Room data
const roomData = {
    'standard-twin': {
        name: 'Standard Twin Room',
        image: './assets/images/sd-twin.jpg',
        description: 'This twin room features air conditioning, a seating area and a TV. The unit offers 2 beds.',
        amenities: ['2 twin beds', 'Hairdryer', 'TV', 'Telephone', 'No smoking'],
        price: 250
    },
    'standard-double': {
        name: 'Standard Double Room',
        image: './assets/images/sd-double.jpg',
        description: 'This double room has air conditioning, a seating area and a TV. The unit has 1 bed.',
        amenities: ['1 queen bed', 'Hairdryer', 'TV', 'Telephone', 'No smoking'],
        price: 350
    },
    'deluxe-double': {
        name: 'Deluxe Double Room',
        image: './assets/images/dx-double.jpg',
        description: 'This double room has air conditioning, a seating area and a TV. The unit has 1 bed.',
        amenities: ['1 queen bed', 'Hairdryer', 'TV', 'Telephone', 'No smoking'],
        price: 700
    },
    'deluxe-suite': {
        name: 'Deluxe Suite',
        image: './assets/images/ds.jpg',
        description: 'This double room has air conditioning, a seating area and a TV. The unit has 1 bed.',
        amenities: ['1 queen bed', 'Hairdryer', 'TV', 'Telephone', 'Refrigerator', 'Fan', 'No smoking'],
        price: 1500
    }
};

let bookings = JSON.parse(localStorage.getItem('hotelBookings') || '[]');

function getRoomTypeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room') || 'standard-twin';
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getTodayDate() {
    return formatDate(new Date());
}

function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
}

function checkAvailability(roomType, checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const conflictingBookings = bookings.filter(booking => {
        if (booking.roomType !== roomType) return false;
        
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);

        return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn);
    });
    
    return {
        available: conflictingBookings.length === 0,
        conflicts: conflictingBookings
    };
}

function getUnavailableDates(roomType) {
    return bookings.filter(booking => booking.roomType === roomType)
                  .map(booking => `${booking.checkIn} to ${booking.checkOut}`);
}

function calculateTotalPrice(roomType, checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const pricePerNight = roomData[roomType].price;
    return nights * pricePerNight;
}

function validateBooking(roomType, checkIn, checkOut, guestName, guestEmail, guests) {
    const errors = [];
    
    if (!guestName.trim()) errors.push('Guest name is required');
    if (!guestEmail.trim()) errors.push('Guest email is required');
    if (!checkIn) errors.push('Check-in date is required');
    if (!checkOut) errors.push('Check-out date is required');
    if (guests < 1) errors.push('At least 1 guest is required');
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) errors.push('Check-in date cannot be in the past');
    if (checkOutDate <= checkInDate) errors.push('Check-out date must be after check-in date');
    
    const availability = checkAvailability(roomType, checkIn, checkOut);
    if (!availability.available) {
        errors.push('Selected dates are not available');
    }
    
    return errors;
}

function makeBooking(roomType, checkIn, checkOut, guestName, guestEmail, guests) {
    const booking = {
        id: Date.now().toString(),
        roomType: roomType,
        checkIn: checkIn,
        checkOut: checkOut,
        guestName: guestName,
        guestEmail: guestEmail,
        guests: parseInt(guests),
        totalPrice: calculateTotalPrice(roomType, checkIn, checkOut),
        bookingDate: new Date().toISOString()
    };
    
    bookings.push(booking);
    localStorage.setItem('hotelBookings', JSON.stringify(bookings));
    
    return booking;
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = message;
    messageDiv.className = `status-message ${type}`;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

function updateAvailabilityInfo(roomType) {
    const unavailableDates = getUnavailableDates(roomType);
    const unavailableDiv = document.getElementById('unavailable-dates');
    
    if (unavailableDates.length > 0) {
        unavailableDiv.innerHTML = `<strong>Currently unavailable dates:</strong><br>${unavailableDates.join('<br>')}`;
    } else {
        unavailableDiv.innerHTML = '<strong>All dates currently available!</strong>';
    }
}

function updateTotalPrice() {
    const roomType = getRoomTypeFromURL();
    const checkIn = document.getElementById('checkin').value;
    const checkOut = document.getElementById('checkout').value;
    const totalPriceDiv = document.getElementById('total-price');
    
    if (checkIn && checkOut) {
        const total = calculateTotalPrice(roomType, checkIn, checkOut);
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        totalPriceDiv.innerHTML = `<strong>Total: $${total} (${nights} night${nights !== 1 ? 's' : ''})</strong>`;
    } else {
        totalPriceDiv.innerHTML = `<strong>Price per night: $${roomData[roomType].price}</strong>`;
    }
}

function initializePage() {
    const roomType = getRoomTypeFromURL();
    const room = roomData[roomType];
    
    if (!room) {
        document.getElementById('reservation-content').innerHTML = '<p>Room not found. Please go back and select a valid room.</p>';
        return;
    }
    
    const content = `
        <img src="${room.image}" alt="${room.name}">
        <div class="room-info">
            <div class="room-title">${room.name}</div>
            <div class="room-description">
                ${room.description}
                <br><br>Included:
                <br>- ${room.amenities.join('<br>- ')}
            </div>
            <div class="unavailable-dates" id="unavailable-dates"></div>
        </div>
        <div class="booking-form">
            <div class="form-group">
                <label for="room-select">Change Room:</label>
                <select id="room-select" onchange="changeRoom()">
                    <option value="standard-twin">Standard Twin Room - &#8369;250</option>
                    <option value="standard-double">Standard Double Room - &#8369;350</option>
                    <option value="deluxe-double">Deluxe Double Room - &#8369;700</option>
                    <option value="deluxe-suite">Deluxe Suite - &#8369;1500</option>
                </select>
            </div>
            
            <div class="price" id="total-price">Price per night: ${room.price}</div>
            
            <div class="form-group">
                <label for="guest-name">Guest Name:</label>
                <input type="text" id="guest-name" required>
            </div>
            
            <div class="form-group">
                <label for="guest-email">Email:</label>
                <input type="email" id="guest-email" required>
            </div>
            
            <div class="form-group">
                <label for="checkin">Check-in Date:</label>
                <input type="date" id="checkin" min="${getTodayDate()}" required>
            </div>
            
            <div class="form-group">
                <label for="checkout">Check-out Date:</label>
                <input type="date" id="checkout" min="${getTomorrowDate()}" required>
            </div>
            
            <div class="form-group">
                <label for="guests">Number of Guests:</label>
                <select id="guests" required>
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                </select>
            </div>
            
            <button type="button" class="book-btn" onclick="handleBooking()">Book Now</button>
            
            <div id="status-message" class="status-message" style="display: none;"></div>
        </div>
    `;
    
    document.getElementById('reservation-content').innerHTML = content;

    const roomSelect = document.getElementById('room-select');
    roomSelect.value = roomType;
    
    updateAvailabilityInfo(roomType);

    document.getElementById('checkin').addEventListener('change', function() {
        const checkOutInput = document.getElementById('checkout');
        const checkInDate = new Date(this.value);
        const minCheckOut = new Date(checkInDate);
        minCheckOut.setDate(minCheckOut.getDate() + 1);
        checkOutInput.min = formatDate(minCheckOut);
        
        if (checkOutInput.value && new Date(checkOutInput.value) <= checkInDate) {
            checkOutInput.value = formatDate(minCheckOut);
        }
        
        updateTotalPrice();
    });
    
    document.getElementById('checkout').addEventListener('change', updateTotalPrice);
}

function handleBooking() {
    const roomType = getRoomTypeFromURL();
    const guestName = document.getElementById('guest-name').value;
    const guestEmail = document.getElementById('guest-email').value;
    const checkIn = document.getElementById('checkin').value;
    const checkOut = document.getElementById('checkout').value;
    const guests = document.getElementById('guests').value;
    
    const errors = validateBooking(roomType, checkIn, checkOut, guestName, guestEmail, guests);
    
    if (errors.length > 0) {
        showMessage(errors.join('. '), 'error');
        return;
    }
    
    try {
        const booking = makeBooking(roomType, checkIn, checkOut, guestName, guestEmail, guests);
        showMessage(`Booking confirmed! Confirmation ID: #${booking.id}. Total: $${booking.totalPrice}`, 'success');

        document.getElementById('guest-name').value = '';
        document.getElementById('guest-email').value = '';
        document.getElementById('checkin').value = '';
        document.getElementById('checkout').value = '';
        document.getElementById('guests').value = '1';

        updateAvailabilityInfo(roomType);
        updateTotalPrice();

        console.log('All bookings:', JSON.stringify(bookings, null, 2));
        
    } catch (error) {
        showMessage('An error occurred while processing your booking. Please try again.', 'error');
        console.error('Booking error:', error);
    }
}

function changeRoom() {
    const selectedRoom = document.getElementById('room-select').value;

    const newUrl = new URL(window.location);
    newUrl.searchParams.set('room', selectedRoom);
    window.history.pushState({}, '', newUrl);

    clearForm();
    initializePage();
}

function clearForm() {
    const form = document.querySelector('.booking-form');
    if (form) {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.id !== 'room-select') {
                if (input.type === 'text' || input.type === 'email' || input.type === 'date') {
                    input.value = '';
                } else if (input.tagName === 'SELECT' && input.id === 'guests') {
                    input.value = '1';
                }
            }
        });
    }

    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
        statusMessage.style.display = 'none';
    }
}