# Career Counselor Frontend

A React TypeScript application for career counselors to manage student information and counseling notes.

## Features

- **Login System**: Secure authentication for career counselors using mobile number
- **Student Search**: Find students by mobile number
- **Student Details**: View comprehensive student information including:
  - Basic information (name, mobile, email, type)
  - Aptitude test responses and results
  - Previous counseling notes
- **Note Management**: Add and view counseling notes for students
- **Responsive Design**: Mobile-friendly interface that works on all devices

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hook Form** with Zod validation
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
# Create a .env file in the root directory
echo "REACT_APP_API_URL=http://localhost:8000/api/educine" > .env
```

3. Start the development server:

```bash
npm start
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## API Integration

The app integrates with the following backend endpoints:

- `POST /counselors/login` - Counselor authentication
- `GET /counselors/student?mobile={mobile}` - Get student details by mobile
- `POST /counselors/notes` - Save counseling note for a student
- `GET /counselors/notes/{studentRegistrationId}` - Get student notes (included in student details)

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── Login.tsx          # Login page component
│   └── Dashboard.tsx      # Main dashboard component
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── types/
│   └── index.ts           # TypeScript type definitions
├── utils/
│   └── http.ts            # Axios configuration
├── App.tsx                # Main app component
├── index.css              # Global styles with Tailwind
└── index.tsx              # App entry point
```

## Design System

The app uses a consistent color palette based on blue primary colors:

- **Primary**: Blue (#3b82f6)
- **Secondary**: Gray shades
- **Accent**: Light blue variations
- **Destructive**: Red for error states

All components are fully responsive and optimized for mobile devices.

## Authentication

The app uses a simple mobile number-based authentication system:

- Counselors log in using their registered mobile number
- Session is maintained in localStorage
- Automatic logout on token expiration

## Mobile Responsiveness

The interface is designed to work seamlessly on:

- Mobile phones (320px+)
- Tablets (768px+)
- Desktop computers (1024px+)

Key mobile optimizations:

- Touch-friendly buttons and inputs
- Responsive grid layouts
- Optimized typography and spacing
- Collapsible sections on smaller screens

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## License

This project is licensed under the MIT License.
