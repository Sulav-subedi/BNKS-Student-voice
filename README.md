# BNKS Feedback Project

A feedback management system for Budhanilkantha School built with a Javascript (React) frontend and FastAPI backend. 

(Didn't had time so used AI to make ReadME. Sorry.)


## 🏗️ Project Structure

```
BNKS feedback project/
├── backend/                 # FastAPI Python backend
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend environment variables
├── frontend/               # React TypeScript frontend
│   ├── src/               # React source code
│   ├── package.json       # Node.js dependencies
│   └── .env               # Frontend environment variables
└── README.md              # This file
```


### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher) and npm/yarn
- **Python** (v3.8 or higher)
- **MongoDB** (running locally on `localhost:27017`)
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "BNKS feedback project"
```

### 2. Backend Setup

Navigate to the backend directory and set up the Python environment:

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

C# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

Navigate to the frontend directory and install Node.js dependencies:

```bash
cd ../frontend

# Install dependencies using npm or yarn
npm install
# or
yarn install
```

### 4. Environment Configuration

The project includes pre-configured `.env` files, but you may want to customize them:

**Backend `.env`** (located in `backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
JWT_SECRET=budhanilkantha-feedback-secret-key-2025
```

**Frontend `.env`** (located in `frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=3000
ENABLE_HEALTH_CHECK=false
```

### 5. Start the Applications

You need to run both the backend and frontend servers simultaneously.

#### Start the Backend Server

```bash
cd backend
uvicorn server:app
```

The backend will start on something like `http://localhost:8000`

#### Start the Frontend Development Server

In a **new terminal window**:

```bash
cd frontend
npm start
# or
yarn start
```

The frontend will start on `http://localhost:3000`

## 🌐 Access the Application

Once both servers are running:

- **Frontend Application**: http://localhost:3000
- **Backend API Documentation**: http://localhost:8000/docs
- **Backend ReDoc**: http://localhost:8000/redoc

## 📋 Features

- **User Authentication**: Secure JWT-based authentication system
- **Anonymous Feedback**: Users can submit feedback anonymously
- **Department/Club System**: Organized feedback by departments and clubs
- **Real-time Updates**: FastAPI with WebSocket support for real-time features
- **Modern UI**: Built with React, TypeScript, TailwindCSS, and Radix UI components
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **MongoDB**: NoSQL database for data storage
- **Motor**: Async MongoDB driver for Python
- **JWT**: JSON Web Tokens for authentication
- **Pydantic**: Data validation using Python type annotations

### Frontend
- **React 19**: Modern React with hooks
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI components
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **React Hook Form**: Form handling with validation

## 🔧 Development Commands

### Backend Commands

```bash
# Start the development server
python server.py

# Run tests
pytest

# Code formatting
black .
isort .

# Linting
flake8 .
mypy .
```

### Frontend Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Code formatting and linting
npm run lint
```

## 📝 API Endpoints

The backend provides RESTful API endpoints. Visit `http://localhost:8000/docs` for interactive API documentation.

Main endpoints include:
- `/api/auth/` - Authentication routes
- `/api/feedback/` - Feedback management
- `/api/users/` - User management
- `/api/departments/` - Department information
- `/api/clubs/` - Club information

## 🗄️ Database Setup

1. **Install MongoDB**: Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. **Start MongoDB Service**: Ensure MongoDB is running on `localhost:27017`
3. **Database Creation**: The application will automatically create the database specified in `DB_NAME` environment variable

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running on `localhost:27017`
   - Check the `MONGO_URL` in backend `.env` file

2. **Port Already in Use**:
   - Backend: Change port in `server.py` or stop the process using port 8000
   - Frontend: Change port in `package.json` or stop the process using port 3000

3. **CORS Issues**:
   - Ensure `CORS_ORIGINS` in backend `.env` includes your frontend URL
   - Default configuration allows all origins (`*`)

4. **Dependencies Issues**:
   - Backend: Try `pip install -r requirements.txt --upgrade`
   - Frontend: Try `rm -rf node_modules package-lock.json && npm install`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This is a feedback system specifically designed for Budhanilkantha School. Make sure to configure the environment variables appropriately for your deployment environment.
