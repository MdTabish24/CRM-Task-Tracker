# About Internal CRM + Task Tracker

## Project Goal
A comprehensive role-based CRM system designed to manage student admissions, track caller performance, handle visit scheduling, and monitor financial transactions. The system automates caller assignment, tracks progress in real-time, and provides detailed analytics for supervisors and administrators.

## How It Works

### For Admin
- Upload CSV/Excel files with student data
- System automatically assigns records to available callers
- Monitor real-time progress through interactive dashboards
- Manage users (add/edit/delete callers and supervisors)
- Track financial transactions (earnings from student fees, operational expenses)
- Generate detailed reports on caller performance and admissions

### For Callers
- View assigned student records
- Update call status (Interested, Not Interested, Follow-up, Visited)
- Schedule and manage student visits
- Set reminders for follow-ups
- Track personal performance metrics

### For Supervisors
- Overview of all operations and statistics
- Monitor financial health (income vs expenses)
- Track caller performance and productivity
- Access visit statistics and admission data

### Key Features
- **Automated Assignment**: CSV uploads automatically distribute records among callers
- **Visit Management**: Schedule visits, track fees (pending/paid), manage student admissions
- **Finance Tracking**: GPay-style interface for tracking all income and expenses
- **Reminder System**: Automated email reminders for follow-ups
- **Real-time Analytics**: Live dashboards showing progress, conversion rates, and performance

## Major Tech Stacks

### Backend
- **Python Flask** - Web framework
- **SQLAlchemy** - ORM for database operations
- **MySQL** - Relational database
- **JWT** - Authentication and authorization
- **Flask-Mail** - Email notifications

### Frontend
- **React** - UI library
- **Vibe UI** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation

### Deployment
- **Railway** - Cloud hosting platform (free tier)
- **Gunicorn** - WSGI HTTP server
