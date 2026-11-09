(function () {
    const STORAGE_KEY = 'barber_appointments';
    const timeSlots = [
        '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    let appointments = [];
    let currentWeekStart = getStartOfWeek(new Date());

    const bookingForm = document.getElementById('booking-form');
    const clientNameInput = document.getElementById('client-name');
    const selectBarberInput = document.getElementById('select-barber');
    const selectServiceInput = document.getElementById('select-service');
    const appointmentDateInput = document.getElementById('appointment-date');
    const appointmentTimeInput = document.getElementById('appointment-time');
    const activeBookingsList = document.getElementById('active-bookings-list');
    const weekRangeDisplay = document.getElementById('week-range-display');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const thisWeekBtn = document.getElementById('this-week-btn');
    const navTabs = document.querySelectorAll('.nav-tab');
    const screenViews = document.querySelectorAll('.screen-view');
    const weeklyDaysGrid = document.getElementById('weekly-days-grid');

    function readStoredAppointments() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            appointments = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            appointments = [];
        }
    }

    function saveAppointments() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    }

    function getStartOfWeek(date) {
        const copy = new Date(date);
        const day = copy.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        copy.setDate(copy.getDate() + diff);
        copy.setHours(0, 0, 0, 0);
        return copy;
    }

    function addDays(date, days) {
        const copy = new Date(date);
        copy.setDate(copy.getDate() + days);
        return copy;
    }

    function toDateInputValue(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function parseLocalDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function timeToMinutes(timeValue) {
        if (!timeValue || !timeValue.includes(':')) {
            return 0;
        }

        const [hours, minutes] = timeValue.split(':').map(Number);
        return (hours * 60) + minutes;
    }

    function parseDuration(serviceString) {
        const match = serviceString.match(/(\d+)\s*mins?/i);
        if (match) {
            return Number(match[1]);
        }
        return 30;
    }

    function getDisplayServiceName(serviceString) {
        return serviceString
            .replace(/\s*\(\$\d+\)\s*\[[^\]]+\]\s*$/, '')
            .replace(/\s*\(\$\d+\)\s*$/, '');
    }

    function getWeekDates() {
        return Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
    }

    function hasConflict(newAppointment) {
        const newStart = timeToMinutes(newAppointment.time);
        const newEnd = newStart + newAppointment.duration;

        return appointments.some((appointment) => {
            if (appointment.barber !== newAppointment.barber || appointment.date !== newAppointment.date) {
                return false;
            }

            const existingStart = timeToMinutes(appointment.time);
            const existingEnd = existingStart + appointment.duration;

            return newStart < existingEnd && newEnd > existingStart;
        });
    }

    function renderAppointmentList() {
        if (!activeBookingsList) {
            return;
        }

        const sortedAppointments = [...appointments].sort((a, b) => {
            const left = `${a.date} ${a.time}`;
            const right = `${b.date} ${b.time}`;
            return left.localeCompare(right);
        });

        if (sortedAppointments.length === 0) {
            activeBookingsList.innerHTML = '<p class="empty-state">No appointments scheduled yet.</p>';
            return;
        }

        activeBookingsList.innerHTML = sortedAppointments
            .map((appointment) => {
                const serviceName = getDisplayServiceName(appointment.serviceInfo);
                const appointmentDate = parseLocalDate(appointment.date);
                const formattedDate = appointmentDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });

                return `
                    <div class="appointment-item" data-id="${appointment.id}">
                        <div>
                            <h4>${appointment.clientName}</h4>
                            <p>${appointment.barber} • ${serviceName}</p>
                            <span>${formattedDate} • ${appointment.time}</span>
                        </div>
                        <button class="remove-booking" data-remove-id="${appointment.id}" type="button">Remove</button>
                    </div>
                `;
            })
            .join('');

        activeBookingsList.querySelectorAll('[data-remove-id]').forEach((button) => {
            button.addEventListener('click', (event) => {
                const id = Number(event.currentTarget.dataset.removeId);
                const appointment = appointments.find((item) => item.id === id);

                if (!appointment) {
                    return;
                }

                if (window.confirm(`Cancel appointment for ${appointment.clientName}?`)) {
                    appointments = appointments.filter((item) => item.id !== id);
                    saveAppointments();
                    renderAll();
                }
            });
        });
    }

    function setActiveScreen(screenId) {
        screenViews.forEach((screen) => {
            screen.classList.toggle('active', screen.id === screenId);
        });

        navTabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.screen === screenId);
        });
    }

    function renderWeekHeader() {
        if (!weekRangeDisplay) {
            return;
        }

        const weekDates = getWeekDates();
        const start = weekDates[0];
        const end = weekDates[6];
        const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        weekRangeDisplay.textContent = `${startLabel} - ${endLabel}`;
    }

    function renderWeeklyCalendar() {
        if (!weeklyDaysGrid) {
            return;
        }

        const timeColumn = document.querySelector('.time-column');
        if (timeColumn) {
            timeColumn.innerHTML = '<div class="time-header">Time</div>' +
                timeSlots.map((slot) => `<div class="time-slot">${slot}</div>`).join('');
        }

        weeklyDaysGrid.innerHTML = '';

        const weekDates = getWeekDates();
        weekDates.forEach((date) => {
            const dayDateKey = toDateInputValue(date);
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';

            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <span class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <strong class="day-number">${date.getDate()}</strong>
            `;
            dayColumn.appendChild(dayHeader);

            timeSlots.forEach((slotText, index) => {
                const slot = document.createElement('div');
                slot.className = 'day-slot';
                slot.dataset.date = dayDateKey;
                slot.dataset.hour = index + 9;

                const matchingAppointments = appointments.filter((appointment) => {
                    if (appointment.date !== dayDateKey) {
                        return false;
                    }

                    const startMinutes = timeToMinutes(appointment.time);
                    const slotStart = (index + 9) * 60;
                    const slotEnd = slotStart + 60;
                    return startMinutes >= slotStart && startMinutes < slotEnd;
                });

                matchingAppointments.forEach((appointment) => {
                    const badge = document.createElement('button');
                    badge.type = 'button';
                    badge.className = 'calendar-event';
                    badge.innerHTML = `<span>${appointment.clientName}</span><small>${appointment.time}</small>`;
                    badge.title = `${appointment.clientName} - ${appointment.barber} - ${appointment.time}`;
                    badge.addEventListener('click', () => {
                        if (window.confirm(`Cancel appointment for ${appointment.clientName}?`)) {
                            appointments = appointments.filter((item) => item.id !== appointment.id);
                            saveAppointments();
                            renderAll();
                        }
                    });
                    slot.appendChild(badge);
                });

                dayColumn.appendChild(slot);
            });

            weeklyDaysGrid.appendChild(dayColumn);
        });
    }

    function renderAll() {
        renderAppointmentList();
        renderWeekHeader();
        renderWeeklyCalendar();
    }

    function initNavigation() {
        navTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                setActiveScreen(tab.dataset.screen);
            });
        });
    }

    function initBookingForm() {
        if (!bookingForm) {
            return;
        }

        if (appointmentDateInput && !appointmentDateInput.value) {
            appointmentDateInput.value = toDateInputValue(new Date());
        }

        if (appointmentTimeInput && !appointmentTimeInput.value) {
            appointmentTimeInput.value = '09:00';
        }

        bookingForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const newAppointment = {
                id: Date.now(),
                clientName: clientNameInput.value.trim(),
                barber: selectBarberInput.value,
                serviceInfo: selectServiceInput.value,
                date: appointmentDateInput.value,
                time: appointmentTimeInput.value,
                duration: parseDuration(selectServiceInput.value)
            };

            if (!newAppointment.clientName || !newAppointment.barber || !newAppointment.serviceInfo || !newAppointment.date || !newAppointment.time) {
                alert('Please complete all booking details before continuing.');
                return;
            }

            if (hasConflict(newAppointment)) {
                alert('⚠️ This barber already has an appointment during that time slot.');
                return;
            }

            appointments.push(newAppointment);
            saveAppointments();
            bookingForm.reset();
            if (appointmentDateInput) {
                appointmentDateInput.value = toDateInputValue(new Date());
            }
            if (appointmentTimeInput) {
                appointmentTimeInput.value = '09:00';
            }
            renderAll();
        });
    }

    function initWeekControls() {
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                currentWeekStart = addDays(currentWeekStart, -7);
                renderAll();
            });
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                currentWeekStart = addDays(currentWeekStart, 7);
                renderAll();
            });
        }

        if (thisWeekBtn) {
            thisWeekBtn.addEventListener('click', () => {
                currentWeekStart = getStartOfWeek(new Date());
                renderAll();
            });
        }
    }

    function init() {
        readStoredAppointments();
        initNavigation();
        initBookingForm();
        initWeekControls();
        setActiveScreen('screen-1');
        renderAll();
    }

    init();
})();
