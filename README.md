# Hostel Complaint Management System

A modern, responsive web application for managing hostel complaints with Google authentication and AI validation.

## Features

- 🔐 Google OAuth authentication (IITM smail only)
- 🤖 AI-powered complaint validation using Groq API
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🌙 Dark/light theme toggle
- 💾 MySQL database storage
- ✨ Modern, aesthetic UI with vibrant colors

## Setup Instructions

### 1. Prerequisites

- Web server (Apache/Nginx)
- PHP 7.4 or higher
- MySQL/MariaDB
- Composer (for Google Client Library)

### 2. Installation

1. Clone/download the project files to your web directory

2. Install PHP dependencies:

3. Create MySQL database:

4. Configure the application:
- Copy `config.php` and update database credentials
- Set up Google OAuth credentials in Google Cloud Console
- Get Groq API key from https://groq.com
- Update all API keys and credentials in `config.php`

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `config.php`

### 4. Groq API Setup

1. Sign up at [Groq](https://groq.com)
2. Get your API key
3. Update `GROQ_API_KEY` in `config.php`

### 5. File Permissions

Ensure proper file permissions:

## Usage

1. Visit `login.html` to start
2. Sign in with IITM smail account
3. Fill the complaint form
4. AI validates the complaint
5. If valid, complaint is stored in database

## File Structure

- `login.html` - Authentication page
- `dashboard.html` - Main complaint form
- `styles.css` - All CSS styles with theme support
- `script.js` - Frontend JavaScript functionality
- `config.php` - Configuration and database connection
- `auth.php` - Google authentication handler
- `submit_complaint.php` - Complaint processing and AI validation
- `database.sql` - Database schema

## Customization

### Theme Colors

Edit CSS variables in `:root` and `[data-theme="dark"]` selectors in `styles.css`

### AI Validation

Modify the validation prompt and logic in `validateComplaintWithAI()` function in `submit_complaint.php`

### Form Fields

Add/modify form fields in `dashboard.html` and update corresponding PHP validation

## Security Features

- Session management
- CSRF protection
- Input validation and sanitization
- SQL injection prevention using prepared statements
- Email domain validation for IITM accounts only

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is for educational/internal use. Ensure compliance with your institution's policies.
