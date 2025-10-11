import { useState, useEffect, useRef, useMemo } from "react";
import { collection, addDoc } from "firebase/firestore";
import RoughNotationText from './RoughNotationText';
import { db } from "../../firebase/config";
import cameraroute from '../assets/cameraroute.png';
import { useComponentText } from '../hooks/useText';

const CONTACT_TRANSLATIONS = {
  title: {
    it: "Parliamone",
    en: "Let's chat"
  },
  namePlaceholder: {
    it: "nome",
    en: "name"
  },
  emailPlaceholder: {
    it: "email",
    en: "email"
  },
  messagePlaceholder: {
    it: "messaggio ... ",
    en: "message ... "
  },
  sendButton: {
    it: "Invia Messaggio",
    en: "Send Message"
  },
  sending: {
    it: "Invio...",
    en: "Sending..."
  },
  description: {
    it: "Vuoi partecipare a uno dei nostri eventi o hai un'idea da condividere?",
    en: "Do you wanna take part in any of our events or have an idea to share?"
  },
  emailLabel: {
    it: "✉️ email:",
    en: "✉️ email:"
  },
  telephoneLabel: {
    it: "📱 telefono:",
    en: "📱 telephone:"
  },
  locationLabel: {
    it: "📍 in giro per la città ;)",
    en: "📍 around the city ;)"
  },
  errorRequired: {
    it: "Per favore compila tutti i campi.",
    en: "Please fill in all fields."
  },
  successMessage: {
    it: "Messaggio inviato! Ti risponderemo presto.",
    en: "Message sent! We'll get back to you soon."
  },
  errorMessage: {
    it: "Errore nell'invio del messaggio. Riprova più tardi.",
    en: "Error sending message. Please try again later."
  }
};

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);


  const mobileImageRef = useRef(null);
  const desktopImageRef = useRef(null);

  const { t } = useComponentText(CONTACT_TRANSLATIONS);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer for image animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isImageVisible) {
          setIsImageVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px"
      }
    );

    const currentMobileRef = mobileImageRef.current;
    const currentDesktopRef = desktopImageRef.current;

    if (currentMobileRef) observer.observe(currentMobileRef);
    if (currentDesktopRef) observer.observe(currentDesktopRef);

    return () => {
      if (currentMobileRef) observer.unobserve(currentMobileRef);
      if (currentDesktopRef) observer.unobserve(currentDesktopRef);
    };
  }, [isImageVisible]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (status.type === "success") {
      const timer = setTimeout(() => {
        setStatus({ type: "", text: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus({ type: "error", text: t('errorRequired') });
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "mail"), {
        to: "urbanphotohunts.roma@gmail.com",
        message: {
          subject: `New message from ${name} - Urban pH`,
          text: `
Name: ${name}
Email: ${email}
Date: ${new Date().toLocaleString('en-US')}

Message:
${message}

---
This message was sent from the Urban pH contact form.
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New message from Urban pH</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Date:</strong> ${new Date().toLocaleString('en-US')}</p>
              </div>
              <div style="background: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h3 style="color: #555;">Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
              <p style="color: #888; font-size: 12px;">
                This message was sent automatically from the Urban pH contact form.
              </p>
            </div>
          `
        },
        createdAt: new Date(),
        senderEmail: email,
        senderName: name,
        status: "pending"
      });

      setStatus({
        type: "success",
        text: t('successMessage'),
      });

      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setStatus({
        type: "error",
        text: t('errorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };

  const imageAnimationClass = isImageVisible
    ? "animate-fade-in-left"
    : "opacity-0 translate-x-8";


  const submitButton = useMemo(() => (
    <button
      type="submit"
      disabled={loading}
      className="relative group"
    >
      <RoughNotationText
        type="box"
        color="#4A7E74"
        strokeWidth={2}
        animationDelay={800}
        trigger={hasAnimated}
      >
        <span className={`inline-block px-6 py-2 font-medium transition-opacity ${loading ? "opacity-50" : "group-hover:opacity-80"}`}>
          {loading ? t('sending') : t('sendButton')}
        </span>
      </RoughNotationText>
    </button>
  ), [loading, hasAnimated, t]); // Si ri-renderizza solo quando cambiano questi valori

  return (
    <>
      <style>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(2rem);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out forwards;
        }
      `}</style>

      <section id="contact" className="py-16 px-4 mt-0 md:mt-12">
        <div className="w-full max-w-6xl mx-auto">

          {/* Title + small image on the right (mobile only image) */}
          <div className="flex items-center justify-between relative">
            <h2 className="text-2xl md:text-3xl font-bold text-black md:-top-16 mb-2 md:mb-12">
              {t('title')}
            </h2>
            <div className="relative block md:hidden">
              <img
                ref={mobileImageRef}
                src={cameraroute}
                alt="uph illustration"
                className={`w-[228px] h-auto object-contain relative bottom-2 -ml-2 transition-all duration-300 ${imageAnimationClass}`}
              />
            </div>
          </div>

          {/* Main content container */}
          <div className={`${isMobile
            ? "flex flex-col space-y-8"
            : "flex items-start justify-between"
            }`}>

            {/* Form - Left side */}
            <div className={`${isMobile
              ? "w-full"
              : "w-full max-w-md"
              } text-black`}>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-black focus:outline-none transition-colors bg-transparent"
                    placeholder={t('namePlaceholder')}
                  />
                </div>

                <div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-black focus:outline-none transition-colors bg-transparent"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>

                <div>
                  <textarea
                    id="message"
                    required
                    rows="4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-black focus:outline-none transition-colors resize-none bg-transparent"
                    placeholder={t('messagePlaceholder')}
                  />
                </div>

                <div className="pt-4">
                  {submitButton}
                </div>

                {status.text && (
                  <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"
                    } animate-fadeIn`}>
                    {status.text}
                  </p>
                )}
              </form>
            </div>

            {/* Contact Info - Right side */}
            <div className={`${isMobile ? "w-full" : "w-full max-w-md"} text-black`}>

              <div className="space-y-3 justify-between">
                <p className="text-green-900 md:text-xl md:mb-6 md:-ml-[75px]">
                  {t('description')}
                </p>
              </div>

              {/* Desktop image aligned with the form */}
              <div className="hidden md:block relative mb-6">
                <img
                  ref={desktopImageRef}
                  src={cameraroute}
                  alt="uph illustration"
                  className={`w-auto h-auto object-contain relative bottom-10 md:-ml-[125px] transition-all duration-300 ${imageAnimationClass}`}
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-3 justify-between">
                <p className="text-sm md:text-base mt-6">
                  {t('emailLabel')} <a href="mailto:urbanphotohunts.roma@gmail.com" className="underline hover:no-underline">urbanphotohunts.roma@gmail.com</a>
                </p>
                <p className="text-sm md:text-base">
                  {t('telephoneLabel')} <a href="tel:+39 3491148545" className="underline hover:no-underline">+39 3491148545</a>
                </p>
                <p className="text-sm md:text-base">
                  {t('locationLabel')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}