const express = require('express');
const { check, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const csrf = require('csurf');  // CSRF protection
const router = express.Router();
const Reservation = require('./models/Reservation');

// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Input sanitization
function sanitizeMessage(message) {
  return sanitizeHtml(message, {
    allowedTags: [],  // No HTML tags allowed
    allowedAttributes: {}
  });
}

// Get reservations of the logged-in user
router.get('/', ensureAuthenticated, async (req, res) => {
  const reservations = await Reservation.find({ username: req.user.nickname });
  res.json(reservations);
});

// Create a new reservation (with input validation and CSRF protection)
router.post('/', [
  ensureAuthenticated,
  check('date').isISO8601().withMessage('Invalid date format'),
  check('time').isIn(['10 AM', '11 AM', '12 PM']).withMessage('Invalid time'),
  check('location').notEmpty().withMessage('Location is required'),
  check('vehicle_no').notEmpty().withMessage('Vehicle number is required'),
  check('mileage').isNumeric().withMessage('Mileage must be a number')
], csrfProtection, async (req, res) => {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, time, location, vehicle_no, mileage, message } = req.body;

  // Create a new reservation with sanitized data
  const reservation = new Reservation({
    username: req.user.nickname,
    date,
    time,
    location,
    vehicle_no,
    mileage,
    message: sanitizeMessage(message)
  });

  await reservation.save();
  res.json({ message: 'Reservation created successfully' });
});

// Delete a reservation (with access control and CSRF protection)
router.delete('/:id', ensureAuthenticated, csrfProtection, async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  // Ensure the reservation belongs to the current user
  if (reservation.username !== req.user.nickname) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }

  await reservation.remove();
  res.json({ message: 'Reservation deleted successfully' });
});

module.exports = router;
