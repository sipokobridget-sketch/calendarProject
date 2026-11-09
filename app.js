// Application State
let appointments = JSON.parse(localStorage.getItem('barber_appointments')) || [];

// DOM Elements
const bookingForm = document.getElementById('booking-form');
const clientNameInput = document.getElementById('client-name');
const selectBarberInput = document.getElementById('select-barber');
const selectServiceInput = document.getElementById('select-service');
const appointmentDateInput = document.getElementById('appointment-date');
const appointmentTimeInput = document.getElementById('appointment-time');
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const todayBtn = document.getElementById('today-btn');
const currentDateDisplay = document.getElementById('current-date-display');

//Set default date to today
appointmentDateInput.value = currentDate;

//Intialize App on load 
document.addEventListener('DOMContentLoaded', () => {
    upddateHeaderDisplay();
    renderAppointments();

    //handle form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newAppointment = {
            id: Date.now(),
            clientName: clientNameInput.value.trim(),
            barber: selectBarberInput.value,
            serviceInfo: selectServiceInput.value,
            time: appointmentTimeInput.value, // e.g., "09:30"
            duration: parseDuration(selectServiceInput.value) // minutes
        };

        // Check for scheduling conflicts before adding
        if (hasConflict(newAppointment)) {
            alert('⚠️ This barber already has an appointment booked during this time slot.');
            return;
        }

        appointments.push(newAppointment);
        saveAndRender();
        

        //keep the form's date input aligned with whatever date was just booked or viewed
        bookingForm.reset();
        appointmentDateInput.value = currentDate;
    });

    //date navigation buttons
    prevDayBtn.addEventListener('click', () => {
        changeDate(-1);
    });

    nextDayBtn.addEventListener('click', () => {
        changeDate(1);
    });
    
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        appointmentDateInput.value = currentDate.toISOString().split('T')[0];
        upddateHeaderDisplay();
        renderAppointments();
    });
});

//shift active view date by X days 
function changeDate(days) {
    let dateObj = new Date(currentDate);
    dateObj.setDate(dateObj.getDate() + days);
    currentDate = dateObj.toISOString().split('T')[0];
    appointmentDateInput.value = currentDate.toISOString().split('T')[0];
    upddateHeaderDisplay();
    renderAppointments();
}

//Update the top header banner text nicely
function upddateHeaderDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    //Fix timezone shift when paesing YYY-MM-DD  string locally)
    const [year, month, day] = currentDate.split('-');
    const localDate = new Date(year, month - 1, day);
    currentDateDisplay.textContent = localDate.toLocaleDateString('en-US', options);
}

//Extract duration in minutes from the select text string
function parseDuration(serviceString) {
    if (serviceString.includes('30')) return 30;
    if (serviceString.includes('15')) return 15;
    if (serviceString.includes('45')) return 45;
    return 30; // default fallback
}

//Convert "HH:MM" time string into total minutes from midnight for easy math
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

//Overlap detection logic( checks same barber and same date)
function hasConflict(newApp) {
    const newStart = timeToMinutes(newApp.time);
    const newEnd = newStart + newApp.duration;

    // Filter appointments for the same barber and same date
    const barberAppointments = appointments.filter(app => app.barber === newApp.barber && app.date === currentDate);
};
 
for (const app of conflictingAppointments) {
    const existingStart = timeToMinutes(app.time);
    const existingEnd = existingStart + app.duration;

    if (newStart < existingEnd && newEnd > existingStart) {
        return true; // Conflict found!
    }
}
return false;

//Save to localStorage marching current date
function saveAndRender() {
    localStorage.setItem('barber_appointments', JSON.stringify(appointments));
    renderAppointments();
}

//Render appointments matching the active "currentDate"
function renderAppointments() {
    const wrappers = document.querySelectorAll('.slots-wrapper');
    wrappers.forEach(wrapper => wrapper.innerHTML = '');
// Filter appointments for the current date
    const visibleAppointments = appointments.filter(app => app.date === currentDate);

    visibleAppointments.forEach(app => {
        const wrapper = document.querySelector(`.slots-wrapper[data-barber="${app.barber}"]`);
        if (!wrapper) return;

        const startMinutes = timeToMinutes(app.time);
        const shopOpenMinutes = 9 * 60;
        const topOffset = (startMinutes - shopOpenMinutes);
        const height = app.duration;

        const badge = document.createElement('div');
        badge.className = 'appointment-badge';
        badge.style.top = `${topOffset}px`;
        badge.style.height = `${height}px`;
       
        //Clean up the service info to only show the service name without the duration
        const serviceName = app.serviceInfo.split(' - ')[0];

        badge.innerHTML = `
            <strong>${app.clientName}</strong>
            <span>${app.time} (${serviceName})</span>
        `;

        badge.title = "Click to cancel appointment";
        badge.addEventListener('click', () => {
            if (confirm(`Cancel appointment for ${app.clientName}?`)) {
                appointments = appointments.filter(item => item.id !== app.id);
                saveAndRender();
            }
        });

        wrapper.appendChild(badge);
    });
}

// Set today's date heading nicely
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);

// Initialize App on Load
document.addEventListener('DOMContentLoaded', () => {
    renderAppointments();
    
    // Handle form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newAppointment = {
            id: Date.now(),
            clientName: clientNameInput.value.trim(),
            barber: selectBarberInput.value,
            serviceInfo: selectServiceInput.value,
            time: appointmentTimeInput.value, // e.g., "09:30"
            duration: parseDuration(selectServiceInput.value) // minutes
        };

        // Check for scheduling conflicts before adding
        if (hasConflict(newAppointment)) {
            alert('⚠️ This barber already has an appointment booked during this time slot.');
            return;
        }

        appointments.push(newAppointment);
        saveAndRender();
        bookingForm.reset();
    });
});

// Helper to extract duration in minutes from the select text string
function parseDuration(serviceString) {
    if (serviceString.includes('30')) return 30;
    if (serviceString.includes('15')) return 15;
    if (serviceString.includes('45')) return 45;
    return 30; // default fallback
}

// Convert "HH:MM" time string into total minutes from midnight for easy math
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

// Overlap detection logic
function hasConflict(newApp) {
    const newStart = timeToMinutes(newApp.time);
    const newEnd = newStart + newApp.duration;

    // Filter appointments for the same barber
    const barberAppointments = appointments.filter(app => app.barber === newApp.barber);

    for (const app of barberAppointments) {
        const existingStart = timeToMinutes(app.time);
        const existingEnd = existingStart + app.duration;

        // Check if time ranges overlap
        if (newStart < existingEnd && newEnd > existingStart) {
            return true; // Conflict found!
        }
    }
    return false;
}

// Save to localStorage and re-render the grid
function saveAndRender() {
    localStorage.setItem('barber_appointments', JSON.stringify(appointments));
    renderAppointments();
}

// Render appointments into their respective barber columns
function renderAppointments() {
    // Clear existing rendered badges first
    const wrappers = document.querySelectorAll('.slots-wrapper');
    wrappers.forEach(wrapper => wrapper.innerHTML = '');

    appointments.forEach(app => {
        const wrapper = document.querySelector(`.slots-wrapper[data-barber="${app.barber}"]`);
        if (!wrapper) return;

        // Calculate top offset position
        // Our grid starts at 09:00 AM (540 minutes from midnight). Each 60-minute block is 60px tall (1px per minute).
        const startMinutes = timeToMinutes(app.time);
        const shopOpenMinutes = 9 * 60; // 09:00 AM
        const topOffset = (startMinutes - shopOpenMinutes); // 1 minute = 1 pixel height in our CSS grid background setup

        // Calculate height proportional to duration
        const height = app.duration; // 30 mins = 30px height

        // Create the badge element
        const badge = document.createElement('div');
        badge.className = 'appointment-badge';
        badge.style.top = `${topOffset}px`;
        badge.style.height = `${height}px`;
        
        badge.innerHTML = `
            <strong>${app.clientName}</strong>
            <span>${app.time} (${serviceName})</span>
        `;

        // Optional: Click to delete/cancel appointment
        badge.title = "Click to cancel appointment";
        badge.addEventListener('click', () => {
            if (confirm(`Cancel appointment for ${app.clientName}?`)) {
                appointments = appointments.filter(item => item.id !== app.id);
                saveAndRender();
            }
        });

        wrapper.appendChild(badge);
    });
}