# Urban Photo Hunts - Event Booking Website

A simple, lightweight website for Urban Photo Hunts cultural association. The site allows users to view and book free events.

## Features

- Responsive design with Tailwind CSS
- Firebase authentication (Email/Password and Google)
- Event booking functionality
- GitHub Actions workflow for automated deployment

## Project Structure

```
urban-ph/
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions workflow for deployment
├── public/
│   └── ...                 # Public assets
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx   # Authentication modal component
│   │   ├── EventCard.jsx   # Event card component
│   │   ├── Hero.jsx        # Hero section component
│   │   └── Navbar.jsx      # Navigation bar component
│   ├── firebase/
│   │   ├── config.js       # Firebase configuration
│   │   └── setupFirebase.js # Firebase initialization helpers
│   ├── App.jsx             # Main application component
│   ├── index.css           # Global styles with Tailwind imports
│   └── main.jsx            # Application entry point
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore file
├── index.html              # HTML entry point
├── package.json            # Project dependencies and scripts
├── postcss.config.js       # PostCSS configuration for Tailwind
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.js          # Vite configuration
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/urban-ph.git
cd urban-ph

# Install dependencies
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app to your project
4. Enable Authentication (Email/Password and Google sign-in methods)
5. Create a Firestore database in test mode

### 3. Configure Environment Variables

1. Create a `.env` file in the root directory based on `.env.example`
2. Fill in your Firebase configuration values:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:5173/` to view the site.

### 5. Set Up GitHub Repository and Secrets

1. Create a GitHub repository for your project
2. Push your code to the repository
3. In the repository settings, go to "Secrets and variables" > "Actions"
4. Add the following secrets with your Firebase configuration:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

### 6. Configure GitHub Pages

1. In your repository settings, go to "Pages"
2. Set the source to "Deploy from a branch"
3. Select the `gh-pages` branch (it will be created automatically by the workflow)
4. Save your changes

### 7. Update Vite Configuration (if needed)

In `vite.config.js`, make sure the `base` property matches your repository name:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',
})
```

### 8. Trigger Deployment

Push changes to the `main` branch to trigger the GitHub Actions workflow, or manually trigger it from the "Actions" tab.

## Customization

### Updating Event Information

Edit the `initializeFirestore` function in `src/firebase/setupFirebase.js` to change the event details.

### Changing the Theme

Modify the Tailwind configuration in `tailwind.config.js` to customize colors, fonts, and other theme options.

### Adding More Pages

1. Create new components in the `src/components` directory
2. Add routing (you'll need to install a router like React Router)

## License

[MIT](LICENSE)