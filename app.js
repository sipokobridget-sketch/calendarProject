// Application State
let appointments = JSON.parse(localStorage.getItem('barber_appointments')) || [];

// DOM Elements
const bookingForm = document.getElementById('booking-form');
const clientNameInput = document.getElementById('client-name');
const selectBarberInput = document.getElementById('select-barber');
const selectServiceInput = document.getElementById('select-service');
const appointmentTimeInput = document.getElementById('appointment-time');
const currentDateDisplay = document.getElementById('current-date-display');

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
            <span>${app.time} (${app.serviceInfo.split(' - ')[0]})</span>
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