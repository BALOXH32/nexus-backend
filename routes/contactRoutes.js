// ===================================
// BACKEND: Add this to your backend
// File: routes/contactRoutes.js
// ===================================

const express = require('express');
const router = express.Router();
const { 
  createContact, 
  getAllContacts, 
  updateContactStatus 
} = require('../controllers/contactController');

// Public route - create contact message
router.post('/', createContact);

// Admin routes - get and manage contacts
router.get('/', getAllContacts);
router.patch('/:id/status', updateContactStatus);

module.exports = router;
