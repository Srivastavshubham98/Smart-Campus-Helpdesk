# Smart Campus Helpdesk System

## About the Project

Smart Campus Helpdesk System is a web-based application developed to simplify the process of reporting and resolving campus-related issues. Instead of manually informing staff members or visiting different departments, students can raise support tickets through the system and track their progress online.

The application follows a role-based approach where students can create tickets, staff members can resolve assigned issues, and administrators manage the complete workflow. The project was developed as a BCA final year project using Django REST Framework for the backend, React for the frontend, and PostgreSQL as the database.

---

## Why this Project?

Many educational institutions still depend on manual complaint handling, which often causes delays and poor tracking of issues.

This project provides a simple digital solution where:

- Students can report problems easily.
- Staff members receive assigned tasks.
- Administrators can monitor the complete process.
- Every action is recorded for transparency.

---

## Main Features

### Student

- Register and login securely
- Create support tickets
- Upload attachments
- View ticket status
- Add comments
- Receive notifications
- Update profile and password

### Staff

- Login securely
- View assigned tickets
- Update ticket status
- Add comments
- View activity history

### Administrator

- Dashboard with ticket statistics
- Manage users
- Assign tickets
- Monitor activities
- Manage notifications
- Close completed tickets

---

## Technologies Used

### Frontend

- React.js
- Tailwind CSS
- Axios
- React Router
- React Hot Toast

### Backend

- Python
- Django
- Django REST Framework
- JWT Authentication

### Database

- PostgreSQL

---

## Project Structure

```
backend/
frontend/
README.md
```

---

## User Roles

The application contains three user roles.

### Student

Students can create tickets, upload attachments, add comments and monitor the status of their own requests.

### Staff

Staff members can only access tickets assigned to them and are responsible for updating the ticket status.

### Administrator

Administrators have complete control over the system. They can create users, assign tickets, monitor activities and manage the complete helpdesk workflow.

---

## Ticket Workflow

1.Student creates a ticket.
2.Administrator reviews the ticket.
3.Administrator assigns the ticket to a staff member.
4.Staff works on the issue and updates the ticket status.
5.Administrator closes the ticket after verification.

---

## Installation

### Backend

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
npm install
npm run dev
```

---

## Future Improvements

Some features can be added in future versions of the project:

- Email notifications
- OTP verification
- Mobile application
- AI chatbot support
- Real-time notifications
- Analytics dashboard

---

## Author

Shubham

Bachelor of Computer Applications (BCA)

Final Year Project