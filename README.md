# StudyTogether

StudyTogether is a web application designed to make studying more fun and engaging with gamification and social elements. Track your study sessions, manage tasks, and compete with friends on leaderboards to stay motivated.

## Features

- **Pomodoro Timer**: Use the built-in Pomodoro timer to track your study sessions with focus and break intervals.
- **Task Management**: Create, track, and complete study tasks to organize your learning.
- **Leaderboards**: Compete with friends or globally to see who's studied the most or completed the most tasks.
- **Friend System**: Connect with study buddies to see their progress and compete together.
- **User Authentication**: Secure login and registration system.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/studytogether.git
   cd studytogether
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   - Copy the `.env.example` file to `.env` (if not already created)
   - Update the `DATABASE_URL` with your PostgreSQL connection string
   - Update the `NEXTAUTH_SECRET` with a secure random string
   - Update the `NEXTAUTH_URL` to match your application URL

4. Run database migrations
   ```
   npx prisma migrate dev
   ```

5. Start the development server
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

1. Build the application
   ```
   npm run build
   ```

2. Start the production server
   ```
   npm start
   ```

## How to Use

1. **Sign Up/Sign In**: Create an account or sign in to access all features.
2. **Study Timer**: Use the Pomodoro timer on the home page to track your study sessions.
   - Default settings: 25 min focus, 5 min short break, 15 min long break
   - Every 4 focus sessions trigger a long break
3. **Task Management**: Create and manage your study tasks on the Tasks page.
4. **Leaderboard**: Check your ranking compared to friends or globally.
5. **Friends**: Search for and add friends to compare progress and study together.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the Pomodoro Technique for time management
- Built to make studying more fun and social
# hwpostudy
