# 🏥 PulsePoint - Hospital Management System

A comprehensive Hospital Management System built with the PERN stack (PostgreSQL, Express.js, React, Node.js) for managing hospital operations, patient records, doctor information, appointments, prescriptions, and medical history.

## 📋 Features

- **Dashboard**: Overview of system statistics and recent appointments
- **Patient Management**: Add, edit, view, and delete patient records
- **Doctor Management**: Manage doctor profiles with specializations and degrees
- **Appointment Scheduling**: Schedule and manage appointments between patients and doctors
- **Hospital Management**: Manage hospital information and associated doctors
- **Prescription Management**: Create and track prescriptions for appointments
- **Medical History**: Maintain detailed medical history records for patients
- **Departments & Specializations**: Organize doctors by departments and specializations
- **Chambers Management**: Track doctor chambers/clinics

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client

### Frontend

- **React 19** - UI library
- **React Router DOM** - Routing
- **TanStack Query (React Query)** - Data fetching and caching
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE hospital_management;
```

2. Run the schema file to create tables:

```bash
psql -U postgres -d hospital_management -f schema.sql
```

### Backend Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the server directory:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_management
DB_USER=postgres
DB_PASSWORD=your_password
```

4. Start the server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. The `.env` file is already configured:

```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## 🗄️ Database Schema

The system includes the following main entities:

- **Users**: Base table for all user information
- **Patients**: Patient-specific information
- **Doctors**: Doctor-specific information with codes and fees
- **Departments**: Hospital departments
- **Specializations**: Medical specializations
- **Doctor Specializations**: Many-to-many relationship
- **Doctor Degrees**: Educational qualifications
- **Hospitals**: Hospital information
- **Hospital Doctors**: Doctor-hospital associations
- **Chambers**: Doctor private chambers/clinics
- **Appointments**: Patient-doctor appointments
- **Prescriptions**: Medicine prescriptions
- **Medical History**: Patient medical records

## 🚀 API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Patients

- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors

- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments

- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `GET /api/appointments/doctor/:doctorId` - Get appointments by doctor
- `GET /api/appointments/patient/:patientId` - Get appointments by patient
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Hospitals, Prescriptions, Medical History, and more...

## 📱 Usage

1. **Dashboard**: View system overview and recent appointments
2. **Add Patients**: Register new patients with personal and medical information
3. **Add Doctors**: Register doctors with specializations and consultation fees
4. **Schedule Appointments**: Book appointments between patients and doctors
5. **Manage Hospitals**: Add and manage hospital information
6. **Create Prescriptions**: Add prescriptions for completed appointments
7. **Track Medical History**: Maintain comprehensive medical records

## 🎓 DBMS Project Features

This project demonstrates:

- ✅ Complex relational database design
- ✅ Foreign key relationships and constraints
- ✅ Database indexing for performance
- ✅ Transaction management
- ✅ Complex SQL queries with JOINs
- ✅ Data aggregation and grouping
- ✅ RESTful API design
- ✅ Full CRUD operations
- ✅ Database normalization (3NF)

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This is a DBMS project. For production use, additional security measures and testing are required.
A healthcare management software aimed at integrating &amp; streamlining the processes for the medical industries.
