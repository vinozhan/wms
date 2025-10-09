# Smart Waste Management System

A comprehensive web application for managing urban waste collection using the MERN stack (MongoDB, Express.js, React.js, Node.js) with Tailwind CSS for styling.

## Features

### Core Functionality
- **Digital Waste Tracking**: RFID/QR code/sensor-based waste bin monitoring
- **Smart Collection**: Automated scheduling and route optimization
- **Real-time Monitoring**: Live waste level tracking and alerts
- **Payment Processing**: Online billing and payment management
- **Analytics & Reporting**: Comprehensive data analysis for authorities
- **Multi-user Support**: Residents, businesses, collectors, and administrators

### Key Features
- JWT-based authentication and authorization
- Role-based access control (Resident, Business, Collector, Admin)
- Responsive mobile-first design
- Real-time sensor data integration
- Geographic waste bin mapping
- Route optimization for collection trucks
- Payment tracking with multiple methods
- Comprehensive analytics dashboard
- Recycling credit system
- Multi-language support ready

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **Rate limiting** for API protection
- **Jest** and **Supertest** for testing

### Frontend
- **React.js** with hooks and context
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Heroicons** and **Lucide React** for icons
- **Vitest** and **React Testing Library** for testing

## Project Structure

```
WMS/
├── backend/
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Authentication & validation
│   ├── controllers/      # Business logic
│   ├── utils/           # Utility functions
│   ├── tests/           # Test files
│   └── server.js        # Main server file
└── frontend/
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── pages/        # Page components
    │   ├── context/      # React context
    │   ├── hooks/        # Custom hooks
    │   ├── utils/        # Utility functions
    │   └── assets/       # Static assets
    └── public/           # Public assets
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your configurations:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/waste_management_system
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Smart Waste Management System
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Admin)

### Waste Bin Management
- `POST /api/waste-bins` - Create waste bin
- `GET /api/waste-bins` - Get waste bins
- `GET /api/waste-bins/:id` - Get waste bin details
- `PUT /api/waste-bins/:id` - Update waste bin
- `PATCH /api/waste-bins/:id/sensor` - Update sensor data
- `POST /api/waste-bins/scan/:deviceId` - Scan device

### Collection Management
- `POST /api/collections` - Schedule collection
- `GET /api/collections` - Get collections
- `PATCH /api/collections/:id/complete` - Complete collection
- `PATCH /api/collections/:id/start` - Start collection

### Payment Management
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get payments
- `POST /api/payments/:id/process` - Process payment

### Analytics
- `POST /api/analytics/generate` - Generate analytics report
- `GET /api/analytics` - Get analytics reports

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:coverage      # Run with coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run all tests
npm run test:coverage     # Run with coverage report
```

## User Roles & Permissions

### Resident/Business
- Manage personal waste bins
- View collection schedules
- Make payments
- View personal analytics

### Collector
- Scan waste bins
- Record collections
- Update collection status
- View assigned routes

### Administrator
- Manage all users and waste bins
- Generate system reports
- Configure routes and schedules
- Access comprehensive analytics

## Features Implementation

### Digital Waste Tracking
- RFID tag scanning for waste bins
- QR code support for backup identification
- Smart sensor integration for fill level monitoring
- Real-time status updates

### Collection System
- Automated route optimization
- GPS tracking integration ready
- Audio/visual feedback for collectors
- Collection verification system

### Payment System
- Multiple payment methods support
- Automated billing generation
- Recycling credit system
- Payment compliance tracking

### Analytics & Reporting
- Real-time dashboard with key metrics
- Customizable report generation
- Waste trend analysis
- Performance optimization recommendations

## Deployment

### Production Environment Variables

Backend (.env):
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
```

Frontend (.env):
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=Smart Waste Management System
```

### Build Commands

Backend:
```bash
npm start
```

Frontend:
```bash
npm run build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js for security headers
- Role-based access control

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.