// ===================================
// BACKEND: Add this to your backend
// File: controllers/contactController.js
// ===================================

const supabase = require("../config/supabase");

// CREATE CONTACT MESSAGE
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Name, email, and message are required"
      });
    }

    // Insert into contacts table
    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          name: name,
          email: email,
          phone: phone || null,
          subject: subject || 'General Inquiry',
          message: message,
          status: 'new',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: error.message
      });
    }

    res.json({
      message: "Message received! We'll contact you soon.",
      contact: data[0]
    });

  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({
      error: err.message
    });
  }
};

// GET ALL CONTACTS (for admin)
exports.getAllContacts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

// UPDATE CONTACT STATUS
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("contacts")
      .update({ status: status })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.json({
      message: "Status updated",
      contact: data[0]
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
