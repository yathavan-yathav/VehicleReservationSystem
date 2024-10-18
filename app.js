const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const bodyParser = require('body-parser');
const csrf = require('csurf');  // CSRF protection
const helmet = require('helmet');  // Security headers
const enforce = require('express-enforces-ssl');  // Enforce HTTPS

// Load environment variables
dotenv.config({ path: './config/config.env' });

const Reservation = require('models/Reservation');

// Passport Config
passport.use(new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: process.env.AUTH0_CALLBACK_URL
}, function (accessToken, refreshToken, extraParams, profile, done) {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Initialize express
const app = express();

// Security: Helmet
app.use(helmet());  // Adds multiple layers of security (e.g., Content Security Policy, etc.)

// CSRF protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // Secure cookie in production
    httpOnly: true,  // Prevent client-side access to cookies
    maxAge: 3600000  // 1-hour session expiration
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'));

// Routes
app.use('/reservations', require('./routes/reservations'));

// Authentication Routes
app.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile'
}), (req, res) => res.redirect('/'));

app.get('/callback', passport.authenticate('auth0', {
  failureRedirect: '/login'
}), (req, res) => res.redirect('/'));

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Handle CSRF token generation in responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
