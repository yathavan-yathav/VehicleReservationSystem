document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = document.getElementById('csrf-token');
    const reservationForm = document.getElementById('reservation-form');
    const reservationsTableBody = document.querySelector('#reservations-table tbody');
  
    // Fetch CSRF Token
    fetch('/csrf-token')
      .then(response => response.json())
      .then(data => {
        csrfToken.value = data.csrfToken;  // Set CSRF token in the hidden field
      });
  
    // Fetch existing reservations
    const fetchReservations = () => {
      fetch('/reservations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          reservationsTableBody.innerHTML = '';  // Clear existing reservations
          data.forEach(reservation => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${reservation.date}</td>
              <td>${reservation.time}</td>
              <td>${reservation.location}</td>
              <td>${reservation.vehicle_no}</td>
              <td>${reservation.mileage}</td>
              <td>${reservation.message || ''}</td>
              <td><button data-id="${reservation._id}" class="delete-btn">Delete</button></td>
            `;
            reservationsTableBody.appendChild(row);
          });
  
          // Add delete functionality to buttons
          document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function () {
              const reservationId = this.getAttribute('data-id');
              deleteReservation(reservationId);
            });
          });
        })
        .catch(err => console.error(err));
    };
  
    // Handle reservation form submission
    reservationForm.addEventListener('submit', (event) => {
      event.preventDefault();
  
      const formData = new FormData(reservationForm);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
  
      fetch('/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken.value  // Pass CSRF token with the request
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(result => {
          console.log(result);
          fetchReservations();  // Refresh reservations list after successful submission
        })
        .catch(err => console.error(err));
    });
  
    // Delete reservation
    const deleteReservation = (id) => {
      fetch(`/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'CSRF-Token': csrfToken.value  // Pass CSRF token with the delete request
        }
      })
        .then(response => response.json())
        .then(result => {
          console.log(result);
          fetchReservations();  // Refresh reservations list after deletion
        })
        .catch(err => console.error(err));
    };
  
    // Fetch reservations on page load
    fetchReservations();
  });
  