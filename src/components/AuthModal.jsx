import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { createUserProfile } from '../../firebase/userServices';

function AuthModal({ isOpen, onClose, event }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignIn, setIsSignIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  console.log("AuthModal rendering with isOpen:", isOpen);

  if (!isOpen) {
    return null;
  }

  // Styling diretto per assicurarsi che il modale sia visibile
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px'
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isSignIn) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      
      // Crea o aggiorna il profilo utente nel database
      await createUserProfile(userCredential.user);
      onClose();
    } catch (error) {
      console.error("Auth error:", error);
      setError(
        error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' 
          ? 'Invalid email or password' 
          : error.code === 'auth/email-already-in-use' 
            ? 'Email already in use' 
            : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Crea o aggiorna il profilo utente nel database
      await createUserProfile(result.user);
      onClose();
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'}}>
          {isSignIn ? 'Sign In' : 'Sign Up'} to Book Event
        </h2>
        
        <button 
          onClick={onClose}
          style={{position: 'absolute', right: '16px', top: '16px', cursor: 'pointer'}}
        >
          Close
        </button>

        <h3 style={{fontSize: '18px', marginBottom: '12px'}}>
          {event?.title || 'Event'}
        </h3>
        
        {error && (
          <div style={{padding: '10px', backgroundColor: '#FEE2E2', color: '#B91C1C', marginBottom: '16px', borderRadius: '4px'}}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%', 
            padding: '10px', 
            marginBottom: '20px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          Continue with Google
        </button>

        <div style={{marginBottom: '20px', position: 'relative', textAlign: 'center'}}>
          <span style={{backgroundColor: 'white', padding: '0 10px', position: 'relative', zIndex: 1}}>
            Or continue with email
          </span>
        </div>

        <form onSubmit={handleEmailAuth}>
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', marginBottom: '8px'}} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="your@email.com"
            />
          </div>
          
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '8px'}} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="********"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: loading ? '#93C5FD' : '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : isSignIn ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{marginTop: '16px', textAlign: 'center'}}>
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button
            style={{color: '#2563EB', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer'}}
            onClick={() => setIsSignIn(!isSignIn)}
          >
            {isSignIn ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;