import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '../../firebase/config';
import { createUserProfile } from '../../firebase/userServices';
import { useComponentText } from '../hooks/useText';


const AUTHMODAL_TRANSLATIONS = {
  title: {
    it: 'Accedi a Urban pH',
    en: 'Sign In to Urban pH'
  },
  titleEmail: {
    it: 'Accedi con Email',
    en: 'Sign In with Email'
  },
  close: {
    it: 'Chiudi',
    en: 'Close'
  },
  hello: {
    it: 'Ciao',
    en: 'Hello'
  },
  success: {
    it: 'Accesso effettuato con successo',
    en: 'Successfully signed in'
  },
  continueGoogle: {
    it: 'Continua con Google',
    en: 'Continue with Google'
  },
  continueFacebook: {
    it: 'Continua con Facebook',
    en: 'Continue with Facebook'
  },
  withoutPW: {
    it: 'Oppure continua senza password:',
    en: 'Or continue without password:'
  },
  emailLink: {
    it: 'Link via Email',
    en: 'Email Link'
  },
  keepMe: {
    it: 'Resta connesso',
    en: 'Keep me signed in'
  },
  checkEmail: {
    it: '✉️ Controlla la tua email',
    en: '✉️ Check your email'
  },
  spam: {
    it: 'Non dimenticare di controllare anche la cartella spam!',
    en: "Don't forget to check your spam folder!"
  },
  sentTo: {
    it: 'È stato inviato un link di accesso a:',
    en: 'A sign-in link has been sent to:'
  },
  resend: {
    it: 'Invia di nuovo',
    en: 'Send again'
  },
  resendIn: {
    it: (s) => `Invia di nuovo tra ${s}s`,
    en: (s) => `Resend in ${s}s`
  },
  sending: {
    it: 'Invio in corso...',
    en: 'Sending...'
  },
  backOptions: {
    it: 'Torna alle opzioni',
    en: 'Back to Options'
  },
  emailLabel: {
    it: 'Indirizzo Email',
    en: 'Email Address'
  },
  emailPlaceholder: {
    it: 'tu@email.com',
    en: 'your@email.com'
  },
  sendMagicLink: {
    it: 'Invia Link Magico',
    en: 'Send Magic Link'
  },
  sendingLink: {
    it: 'Invio link...',
    en: 'Sending link...'
  },
  loading: {
    it: 'Accesso in corso...',
    en: 'Signing you in...'
  },
  promptEmailForConfirm: {
    it: 'Inserisci la tua email per confermare',
    en: 'Please provide your email for confirmation'
  },
  accountExists: {
    it: 'Account esistente rilevato',
    en: 'Existing Account Detected'
  },
  accountExistsMsg: {
    it: 'Questo indirizzo email è già registrato con un altro metodo di accesso. Per collegare Facebook, devi prima accedere con:',
    en: 'This email address is already registered with a different sign-in method. To link Facebook, please sign in first with:'
  },
  signInFirst: {
    it: 'Accedi prima con Email Link',
    en: 'Sign In with Email Link First'
  },
  thenRetry: {
    it: 'Poi riprova con Facebook per collegare i tuoi account.',
    en: 'Then retry with Facebook to link your accounts.'
  }

};


function AuthModal({ isOpen, onClose, event }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [authSuccess, setAuthSuccess] = useState(false);

  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { t } = useComponentText(AUTHMODAL_TRANSLATIONS);

  useEffect(() => {
    let interval;
    if (emailSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailSent, resendTimer]);


  useEffect(() => {
    if (!isOpen) return;
    // Applica la persistenza appena il modale è aperto o cambia l'opzione.
    // Non fare await, così il click resta una user-gesture valida per il popup.
    setPersistence(
      auth,
      keepSignedIn ? browserLocalPersistence : browserSessionPersistence
    ).catch((err) => {
      console.warn('setPersistence failed (using default):', err);
    });
  }, [isOpen, keepSignedIn]);

  // Reset error and useMagicLink when modal opens or closes
  useEffect(() => {
    // Reset error state when modal opens or closes
    setError('');
    setUseMagicLink(false);
  }, [isOpen]);

  useEffect(() => {
    // Controlla se l'URL contiene un link di sign-in email
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setIsSigningIn(true);

      const processSignInLink = async () => {
        let storedEmail = window.localStorage.getItem('emailForSignIn');

        // Se non c'è email salvata, chiedi SOLO SE non stiamo già processando
        if (!storedEmail) {
          // Aggiungiamo una flag per evitare prompt multipli
          const isProcessingSignIn = sessionStorage.getItem('isProcessingSignIn');

          if (!isProcessingSignIn) {
            sessionStorage.setItem('isProcessingSignIn', 'true');

            // Solo se necessario, prova a estrarre dall'URL
            const extractEmailFromUrl = () => {
              const urlParams = new URLSearchParams(window.location.search);
              return urlParams.get('email');
            };

            const urlEmail = extractEmailFromUrl();

            if (!urlEmail) {
              const promptEmail = window.prompt(t('promptEmailForConfirm'));
              if (promptEmail) {
                storedEmail = promptEmail;
                window.localStorage.setItem('emailForSignIn', promptEmail);
              } else {
                // Se l'utente cancella il prompt, pulisce l'URL e chiude
                cleanupUrl();
                sessionStorage.removeItem('isProcessingSignIn');
                setIsSigningIn(false);
                return;
              }
            } else {
              storedEmail = urlEmail;
              window.localStorage.setItem('emailForSignIn', urlEmail);
            }
          } else {
            // Se stiamo già processando, aspetta un po' e riprova
            setTimeout(() => {
              processSignInLink();
            }, 100);
            return;
          }
        }

        try {
          const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
          await createUserProfile(result.user);
          window.localStorage.removeItem('emailForSignIn');
          sessionStorage.removeItem('isProcessingSignIn');
          cleanupUrl();
          onClose();
        } catch (err) {
          console.error("Email link sign-in failed", err);
          setError('Invalid or expired sign-in link.');
          sessionStorage.removeItem('isProcessingSignIn');
          cleanupUrl();
        } finally {
          setIsSigningIn(false);
        }
      };

      processSignInLink();
    }
  }, []); // Rimuovi onClose dalla dependency array per evitare re-renders

  useEffect(() => {
    if (window.innerWidth < 768) {
      if (isOpen) {
        // Salva la posizione corrente prima dello scroll
        const savedPosition = window.scrollY;

        // Salva in sessionStorage per sicurezza
        sessionStorage.setItem('modalScrollPosition', savedPosition.toString());

        // Scroll in cima con animazione smooth
        window.scrollTo({
          top: 0,
          behavior: 'instant'
        });
      } else {
        // Quando il modal si chiude, ripristina la posizione
        const savedPosition = sessionStorage.getItem('modalScrollPosition');
        if (savedPosition) {
          // Usa setTimeout per assicurarsi che il DOM sia aggiornato
          setTimeout(() => {
            window.scrollTo({
              top: parseInt(savedPosition),
              behavior: 'instant'
            });
            // Pulisci il valore salvato
            sessionStorage.removeItem('modalScrollPosition');
          }, 0);
        }
      }
    }
  }, [isOpen]);


  // Funzione di pulizia URL separata per evitare duplicazione
  const cleanupUrl = () => {
    const url = new URL(window.location.href);
    ['apiKey', 'oobCode', 'mode', 'lang', 'email'].forEach(param => {
      url.searchParams.delete(param);
    });
    window.history.replaceState({}, document.title, url.pathname + url.hash);
  };

  // Function to handle modal close with cleanup
  const handleClose = () => {
    setError('');
    setLoading(false);
    setUseMagicLink(false);
    setAuthSuccess(false);
    setEmailSent(false);
    setResendTimer(0);
    onClose();
  };

  // Non renderizzare se si sta processando il sign-in
  if (isSigningIn) {
    return null;
  }

  if (!isOpen) {
    return null;
  }
  const isMobile = window.innerWidth < 768;
  // Styling diretto per assicurarsi che il modale sia visibile
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center', // Su mobile allinea in alto
    justifyContent: 'center',
    zIndex: 9999,
    overflowY: 'auto',
    paddingTop: isMobile ? '30vh' : '10vh', // Su mobile aggiungi padding top
    paddingBottom: isMobile ? '10vh' : '0' // Padding bottom per sicurezza
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: isMobile ? '80vh' : '90vh', // Riduci altezza max su mobile
    overflowY: 'auto',
    position: 'relative',
    margin: isMobile ? '0 auto' : 'auto' // Centra orizzontalmente su mobile
  };

  const handleEmailLinkAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      //alert('A sign-in link has been sent to your email. Please check your inbox.');
      setEmailSent(true);
      setResendTimer(10);
    } catch (error) {
      console.error("Email link error:", error);
      setError('Failed to send sign-in link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError('');
    setLoading(true);

    try {
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      setResendTimer(5);
    } catch (error) {
      console.error("Resend email error:", error);
      setError('Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (e) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      setAuthSuccess(result.user.displayName || result.user.email);
      await createUserProfile(result.user);

      setTimeout(() => {
        handleClose();
      }, 1600);

    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthSuccess(false);

      // (Opzionale) Se vuoi un "paracadute" automatico: 
      // scommenta le 3 righe sotto per fallback a redirect SOLO quando il popup è bloccato:
      // if (error.code === 'auth/popup-blocked') {
      //   return signInWithRedirect(auth, provider);
      // }

      setError(
        error.code === 'auth/popup-blocked'
          ? 'Popup blocked. Please allow popups and try again.'
          : error.code === 'auth/popup-closed-by-user'
            ? 'Sign-in was cancelled. Please try again.'
            : 'Google sign-in failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await setPersistence(
        auth,
        keepSignedIn ? browserLocalPersistence : browserSessionPersistence
      );

      const provider = new FacebookAuthProvider();

      // Se l'utente è già autenticato, prova a linkare invece di fare sign-in
      if (auth.currentUser) {
        try {
          const result = await linkWithCredential(auth.currentUser,
            FacebookAuthProvider.credential(null) // Dummy, verrà sostituito dal popup
          );
          // In realtà dobbiamo usare linkWithPopup (non disponibile direttamente)
          // Quindi facciamo il popup normale e gestiamo l'errore
        } catch (linkError) {
          // Se il linking fallisce, procedi con il normale sign-in
          console.log('Linking failed, trying normal sign-in', linkError);
        }
      }

      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);

      setAuthSuccess(result.user.displayName || result.user.email);
      setTimeout(() => {
        handleClose();
      }, 1600);

    } catch (error) {
      console.error("Facebook sign-in error:", error);
      setAuthSuccess(false);

      // GESTIONE DELL'ERRORE ACCOUNT ESISTENTE
      if (error.code === 'auth/account-exists-with-different-credential') {
        try {
          const credential = FacebookAuthProvider.credentialFromError(error);
          const email = error.customData?.email;

          if (email) {
            // Salva le informazioni per un eventuale retry
            window.sessionStorage.setItem('pendingFacebookCredential', JSON.stringify({
              email: email,
              timestamp: Date.now()
            }));

            // Controlla quali metodi di sign-in sono disponibili
            const methods = await fetchSignInMethodsForEmail(auth, email);
            const methodsList = methods.map(m => {
              if (m === 'emailLink') return 'Email Link';
              if (m === 'google.com') return 'Google';
              return m;
            }).join(', ');

            // Messaggio chiaro per l'utente
            setError(
              `⚠️ ${t('accountExists')}\n\n` +
              `${t('accountExistsMsg')}\n\n` +
              `📧 ${methodsList}\n\n` +
              `${t('thenRetry')}`
            );

            // Se è email link, passa automaticamente a quella modalità
            if (methods.includes('emailLink')) {
              setTimeout(() => {
                setUseMagicLink(true);
                setEmail(email);
              }, 3000);
            }
          } else {
            setError('Unable to link account. Please try signing in with your original method first.');
          }
        } catch (checkError) {
          console.error('Error checking sign-in methods:', checkError);
          setError('This email is already registered. Please sign in with your original method first, then retry Facebook.');
        }
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError('Facebook sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          {useMagicLink ? t('titleEmail') : t('title')}
        </h2>

        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            right: '16px',
            top: '6px',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>
          {event?.title || ''}
        </h3>

        {error && (
          <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: '#B91C1C', marginBottom: '16px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <svg
              className="animate-spin h-8 w-8 mx-auto mb-4"
              style={{ color: '#3c6c64' }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p style={{ color: '#3c6c64' }}>Signing you in...</p>
          </div>
        ) : authSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <svg
              style={{ width: '48px', height: '48px', color: '#3c6c64', margin: '0 auto 16px' }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#3c6c64' }}>
              {t('hello')}, {authSuccess}!
            </h3>
            <p style={{ color: '#6B7280' }}>{t('success')}</p>
          </div>
        ) : !useMagicLink ? (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('continueGoogle')}
            </button>

            <button
              onClick={handleFacebookSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px', fill: '#1877F2' }}>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {t('continueFacebook')}
            </button>

            <div style={{ marginBottom: '20px', position: 'relative', textAlign: 'center' }}>
              <span style={{ backgroundColor: 'white', padding: '0 10px', position: 'relative', zIndex: 1 }}>
                {t('withoutPW')}
              </span>
            </div>

            <button
              onClick={() => setUseMagicLink(true)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#3c6c64',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              {t('emailLink')}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                id="keepSignedIn"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label
                htmlFor="keepSignedIn"
                style={{ cursor: 'pointer', fontSize: '14px' }}
              >
                {t('keepMe')}
              </label>
            </div>
          </>
        ) : emailSent ? (
          // NUOVO STATO: Email inviata con successo
          <div style={{ textAlign: 'center' }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #3c6c64'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '0px',
                color: '#3c6c64'
              }}>
                {t('checkEmail')}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                {t('spam')}
              </p>
              <p style={{ marginBottom: '0px', color: '#374151' }}>
                {t('sentTo')}
              </p>
              <p style={{
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                {email}
              </p>

            </div>

            <button
              onClick={handleResendEmail}
              disabled={loading || resendTimer > 0}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: (loading || resendTimer > 0) ? '#d1d5db' : '#f4f4d7',
                color: (loading || resendTimer > 0) ? '#9ca3af' : 'black',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: (loading || resendTimer > 0) ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
                fontSize: '14px'
              }}
            >
              {loading ? t('sending') : resendTimer > 0 ? t('resendIn')(resendTimer) : t('resend')}
            </button>

            <button
              type="button"
              onClick={() => {
                setEmailSent(false);
                setResendTimer(0);
                setUseMagicLink(false);
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                color: '#3c6c64',
                border: '1px solid #3c6c64',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('backOptions')}
            </button>
          </div>
        ) : (
          // FORM ORIGINALE per inserire email
          <form onSubmit={handleEmailLinkAuth}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }} htmlFor="email">
                {t('emailLabel')}
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
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: loading ? '#a8b9ac' : '#3c6c64',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: loading ? 'wait' : 'pointer',
                marginBottom: '16px'
              }}
            >
              {loading ? t('sendingLink') : t('sendMagicLink')}
            </button>

            <button
              type="button"
              onClick={() => setUseMagicLink(false)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                color: '#3c6c64',
                border: '1px solid #3c6c64',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t('backOptions')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;