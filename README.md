# Telemedicine Triage Full-Stack Project

Welcome to the Telemedicine Triage project. This application is built with a modern stack for high performance and reliability.

## Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python 3.11+), Pydantic v2
- **Validation**: Strict medical data schemas using Pydantic

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Initial Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/dcodingdev/telemedicine-triage.git
   cd telemedicine-triage
   ```
2. The project structure is already configured with a `.gitignore` to exclude large folders like `node_modules` and `venv`.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `/frontend`: Next.js application with shadcn/ui components.
- `/backend`: FastAPI application with Pydantic schemas.
- `/backend/schemas.py`: Defined data structures for patients and triage requests.
- `/backend/api.py`: Triage logic and API endpoints.

## Features
- **Premium UI**: Modern, responsive design with glassmorphism and smooth animations.
- **Interactive Triage Form**: Multi-step patient onboarding with real-time feedback.
- **Doctor Dashboard**: Live overview of incoming triage requests with priority levels.
