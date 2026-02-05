const axios = require('axios');
require('dotenv').config();

const emailData = {
    sender: { name: "La Liga Hub", email: process.env.EMAIL_USER },
    to: [{ email: process.env.EMAIL_USER }], // Send to self to test
    subject: "Test Email from CLI",
    htmlContent: "<p>This is a test email.</p>"
};

console.log('Sending with key:', process.env.EMAIL_PASS ? 'Present' : 'Missing');
console.log('Sending from:', process.env.EMAIL_USER);

axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
    headers: {
        'api-key': process.env.EMAIL_PASS,
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
})
    .then(response => {
        console.log('✅ Success:', response.data);
    })
    .catch(error => {
        console.error('❌ Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    });
