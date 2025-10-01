import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { getCurrentUsersCount } from "../utils/statsCount";
import RoughNotationText from "./RoughNotationText";
import RoughNotationCircle from "./RoughNotationCircle";
import { useComponentText } from '../hooks/useText';
// Import profile images
import beatriceImg from "../assets/profiles/Beatrice.png";
import lucaImg from "../assets/profiles/Luca.png";
import raffaellaImg from "../assets/profiles/Raffaella.png";
import niccoloImg from "../assets/profiles/Niccolò.png";
import marcoImg from "../assets/profiles/Marco.png";


const TRANSLATIONS = {
  title1: {
    it: 'Chi Siamo',
    en: 'About Us'
  },
  paragraphBeforeCircle: {
    it: "Iniziando da Londra nel 2015, passando per Barcellona nel 2016 e Roma nel 2017, abbiamo trasformato un hobby in",
    en: 'Starting in London in 2015, moving through Barcelona in 2016, and Rome in 2017, we transformed a hobby into a'
  },
  culturalAssociation: {
    it: "un' associazione culturale",
    en: 'cultural association'
  },
  paragraphAfterCircle: {
    it: 'dedicata a <strong>re-immaginare la città</strong> e il nostro posto al suo interno. Organizziamo camminate, workshop e altri eventi, offrendo ai partecipanti una piattaforma per esprimere la propria creatività e scoprire le molteplici sfaccettature delle aree locali. Il nostro obiettivo è <strong>creare una connessione più profonda e consapevole tra gli individui e gli spazi</strong> che attraversano, incoraggiandoli a interagire, esplorare e riflettere sulle <strong>esperienze visive e mentali</strong> che le città offrono, promuovendo al contempo un senso di cura per gli ambienti urbani.',
    en: 'dedicated to <strong>reimagining the city</strong> and our place within it. We organize walks, workshops, and other events, providing participants with a platform to express their creativity and explore the many facets of local areas. Our goal is to create a <strong>deeper, more mindful connection between individuals and the spaces</strong> they navigate, encouraging them to interact, explore, and reflect on the visual and mental experiences that cities offer, while fostering a sense of <strong>care for the urban environments</strong> they inhabit.'
  },
  activeMembers: {
    it: 'membri attivi',
    en: 'active members'
  },
  events: {
    it: 'eventi',
    en: 'events'
  },
  locations: {
    it: 'quartieri',
    en: 'locations'
  },
  partnerships: {
    it: 'partnership',
    en: 'partnerships'
  },
  beatriceRole: {
    it: 'Presidente e Fondatrice',
    en: 'President & Founder'
  },
  beatriceBio: {
    it: "Crescere fra tre città diverse - Bologna, Roma e Londra - un'esperienza a Barcellona e un lungo viaggio fra le capitali del Sud-Est asiatico hanno fatto sì che sviluppassi una profonda curiosità per le realtà urbane, mentre la fotografia è stata una mia passione fin da piccola. A Londra ho fuso questi interessi in un master in sociologia visuale e in un dottorato in antropologia urbana, per poi unire i frutti di entrambi nell'associazione culturale Urban pH, dove la creazione di immagini si unisce all'esplorazione collettiva delle realtà urbane.",
    en: "Growing up between three different cities - Bologna, Rome and London - an experience in Barcelona and a long journey between the capitals of SouthEast Asia made me develop a deep curiosity for urban realities, while photography has been a passion of mine since childhood. In London I merged these interests into a master degree in visual sociology and a doctorate in urban anthropology, and then combined the fruits of both in the cultural association Urban pH, where image-making is combined with the collective exploration of urban realities."
  },
  lucaRole: {
    it: 'Vice Presidente',
    en: 'Vice President'
  },
  lucaBio: {
    it: "Nato nel 1991 a Roma, ho sempre avuto la passione per la fotografia. Ho studiato diverse tecniche e stili, partecipando a mostre e collezionando libri. Ultimamente mi sono orientato principalmente verso la fotografia analogica, godendomi il passaggio alla stampa e allo sviluppo delle immagini nella mia camera oscura domestica. Questo mi permette di dare un tocco personale e autentico a ogni fotografia e workshop di Urban pH.",
    en: "Born in 1991 in Rome, I have always had a passion for photography. I have studied different techniques and styles, participating in exhibitions and collecting books. Lately I have been mainly oriented towards analogue photography, enjoying the transition to printing and developing images in my home darkroom. This allows me to bring a personal and authentic touch to each photograph and workshop at Urban pH."
  },
  raffaellaRole: {
    it: 'Tesoriera',
    en: 'Treasurer'
  },
  raffaellaBio: {
    it: "Mi piace avere interazioni, creare reti e connettere le persone. La parte che preferisco delle cacce fotografiche che organizziamo è lasciarmi sorprendere da come i partecipanti interpretano i temi proposti e dagli spunti che sanno dare per costruire un dibattito...qualche volta scatto anche foto carine!",
    en: "I like to have interactions, create networks and connect people. My favorite part of the photo hunts we organize is being surprised by how participants interpret the proposed topics and the insights they can give to build a debate...sometimes I even take pretty pictures!"
  },
  niccoloRole: {
    it: 'Segretario',
    en: 'Secretary'
  },
  niccoloBio: {
    it: "Sono nato e cresciuto a Roma, studioso di storia dell'arte con una passione per la street art e i segreti che lo spazio urbano nasconde. Grazie a Urban pH, posso esplorare questi mondi in modo creativo e condiviso, confrontandomi con persone che condividono le mie stesse passioni.",
    en: "I am a Roman, an art historian and passionate about street art and the secrets held within urban realms. Thanks to Urban pH I can explore these worlds in a creative and collaborative way, engaging with those who share my passions."
  },
  marcoRole: {
    it: 'Web Designer',
    en: 'Web Designer'
  },
  marcoBio: {
    it: "Sono una persona molto scientifica e razionale ma la fotografia mi ha permesso di andare oltre. Scoprire, scoprirsi e scoperchiare nuovi mondi fotografando è quello che vedo da anni sulla mia strada. Poterlo condividere con altre persone lo fa diventare un vero e proprio viaggio.",
    en: "I consider myself to be very scientific and rational, but photography has opened up a new dimension for me. Through capturing images, I have discovered and uncovered new worlds that I've been observing for years. Sharing these experiences with others turns it into a genuine journey."
  }
}

export default function AboutUs() {
  const sectionRef = useRef(null);
  const counterRef = useRef(null);
  const statsRef = useRef(null);
  const paragraphRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [paragraphHeight, setParagraphHeight] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);

  // Dynamic user count state
  const [currentUsersCount, setCurrentUsersCount] = useState(244); // fallback value

  const titleRef = useRef(null);
  const aboutRef = useRef(null);
  const usRef = useRef(null);
  const [aLeftPx, setALeftPx] = useState(null);
  const [usRightPx, setUsRightPx] = useState(null);
  const [isTextInView, setIsTextInView] = useState(false);
  const { t } = useComponentText(TRANSLATIONS);

  // Animated counters setup
  const membersCount = useMotionValue(0);
  const eventsCount = useMotionValue(0);
  const locationsCount = useMotionValue(0);
  const partnershipsCount = useMotionValue(0);

  const membersRounded = useTransform(membersCount, Math.round);
  const eventsRounded = useTransform(eventsCount, Math.round);
  const locationsRounded = useTransform(locationsCount, Math.round);
  const partnershipsRounded = useTransform(partnershipsCount, Math.round);

  const isParagraphInView = useInView(paragraphRef, {
    once: true,
    threshold: 0.3,
    rootMargin: '0px 0px -20% 0px'
  });

  // Scroll triggers for counter animations
  const isCounterInView = useInView(counterRef, {
    once: true,
    threshold: 0.3,
    rootMargin: '0px 0px -20% 0px'
  });

  const isStatsInView = useInView(statsRef, {
    once: true,
    threshold: 0.3,
    rootMargin: '0px 0px -20% 0px'
  });

  useEffect(() => {
    if (isParagraphInView) {
      setIsTextInView(true);
    }
  }, [isParagraphInView]);

  // Fetch dynamic user count on component mount
  useEffect(() => {
    const fetchUsersCount = async () => {
      try {
        const count = await getCurrentUsersCount();
        setCurrentUsersCount(count);
      } catch (error) {
        console.error('Error loading users count:', error);
        // Keep fallback value (244)
      }
    };

    fetchUsersCount();
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Measure paragraph height
  useEffect(() => {
    const measureParagraph = () => {
      if (paragraphRef.current) {
        setParagraphHeight(paragraphRef.current.offsetHeight);
      }
    };

    measureParagraph();
    window.addEventListener('resize', measureParagraph);

    // Use ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver(measureParagraph);
    if (paragraphRef.current) {
      resizeObserver.observe(paragraphRef.current);
    }

    return () => {
      window.removeEventListener('resize', measureParagraph);
      resizeObserver.disconnect();
    };
  }, []);

  const handleMemberClick = (member) => {
    setSelectedMember(selectedMember?.name === member.name ? null : member);
  };

  useEffect(() => {
    const measure = () => {
      if (aboutRef.current) {
        const aboutBox = aboutRef.current.getBoundingClientRect();
        setALeftPx(aboutBox.left);
      }
      if (usRef.current) {
        const usBox = usRef.current.getBoundingClientRect();
        setUsRightPx(usBox.right);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobile]);

  // Start members counter animation when counter comes into view - NOW USES DYNAMIC COUNT
  useEffect(() => {
    if (isCounterInView) {
      const animation = animate(membersCount, currentUsersCount, {
        duration: 2.5,
        ease: "easeOut"
      });

      return animation.stop;
    }
  }, [membersCount, isCounterInView, currentUsersCount]);

  // Start stats counters animation when stats come into view
  useEffect(() => {
    if (isStatsInView) {
      const animations = [
        animate(eventsCount, 88, {
          duration: 2,
          ease: "easeOut",
          delay: 0.3
        }),
        animate(locationsCount, 25, {
          duration: 2,
          ease: "easeOut",
          delay: 0.5
        }),
        animate(partnershipsCount, 12, {
          duration: 2,
          ease: "easeOut",
          delay: 0.7
        })
      ];

      return () => animations.forEach(animation => animation.stop());
    }
  }, [eventsCount, locationsCount, partnershipsCount, isStatsInView]);


  // Team data with images
  const teamMembers = [
    {
      name: 'Beatrice',
      role: t('beatriceRole'),
      image: beatriceImg,
      bio: t('beatriceBio')
    },
    {
      name: 'Luca',
      role: t('lucaRole'),
      image: lucaImg,
      bio: t('lucaBio')
    },
    {
      name: 'Raffaella',
      role: t('raffaellaRole'),
      image: raffaellaImg,
      bio: t('raffaellaBio')
    },
    {
      name: 'Niccolò',
      role: t('niccoloRole'),
      image: niccoloImg,
      bio: t('niccoloBio')
    },
    {
      name: 'Marco',
      role: t('marcoRole'),
      image: marcoImg,
      bio: t('marcoBio')
    }
  ];

  return (
    <section
      ref={sectionRef}
      data-section="about-us"
      className="relative w-full flex flex-col items-center justify-start bg-transparent"
      style={{ minHeight: "80vh" }}
    >
      {isMobile ? <div style={{ height: "12px" }} /> : <div style={{ height: "120px" }} />}

      {/* Container for both title and text */}
      <div className={`relative w-full max-w-6xl mx-auto px-4 ${isMobile ? 'mb-4' : ''}`}>

        {/* Title - Desktop: split across vertical line, Mobile: centered */}
        <div ref={titleRef} className={`relative z-10 flex items-center ${isMobile ? 'justify-center' : 'justify-left'} h-[10px] mb-8`}>
          <h1 className="text-2xl sm:text-4xl font-bold text-black text-center">
            {t('title1')}
          </h1>
        </div>

        {/* Contenuto: testo a sinistra, statistiche a destra */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* LEFT: Paragraph Text */}
          <div
            ref={paragraphRef}
            className={`${isMobile
              ? "relative z-10 mx-auto px-6 text-black leading-relaxed bg-transparent"
              : "relative z-10 p-8 text-gray-700 leading-relaxed bg-transparent"
              }`}
            style={{
              fontSize: "1.1rem",
              fontWeight: 500,
              textAlign: "justify",
              lineHeight: "1.6",
              marginBottom: '2rem',
              width: isMobile ? '100%' : '100%',
              maxWidth: isMobile ? '600px' : '850px',
              paddingLeft: isMobile ? '' : '0',       // elimina padding per stretchare
              paddingRight: isMobile ? '' : '0'
            }}
          >
            {t('paragraphBeforeCircle')}{' '}
            <RoughNotationCircle
              color="#8B5CF6"
              animate={true}
              animationDelay={1100}
              strokeWidth={1.1}
              trigger={isTextInView}
            >
              <span className="inline-block break-before-all">
                {t('culturalAssociation')}
              </span>
            </RoughNotationCircle>{' '}
            <span dangerouslySetInnerHTML={{ __html: t('paragraphAfterCircle') }} />
          </div>

          {/* RIGHT: 4 stats - centered on mobile, right-aligned on desktop */}
          <div ref={counterRef} className="relative z-10 p-8 bg-transparent">
            <div
              ref={statsRef}
              className={`grid grid-cols-2 gap-4 sm:gap-6 justify-items-center sm:justify-items-end text-center
    ${isMobile ? '-mt-10' : 'mt-0'}`}
            >
              {/* Members */}
              <motion.div
                className="flex flex-col items-center sm:items-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isStatsInView ? 1 : 0,
                  y: isStatsInView ? 0 : 20
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.h3 className="font-bold text-purple-800 text-4xl sm:text-6xl">
                  {membersRounded}
                </motion.h3>
                <p className="text-xs sm:text-sm text-purple-600 font-medium uppercase tracking-wider mt-1">
                  {t('activeMembers')}
                </p>
              </motion.div>

              {/* Events */}
              <motion.div
                className="flex flex-col items-center sm:items-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isStatsInView ? 1 : 0,
                  y: isStatsInView ? 0 : 20
                }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.h3 className="font-bold text-green-800 text-3xl sm:text-6xl">
                  {eventsRounded}
                </motion.h3>
                <p className="text-xs sm:text-sm text-green-800 font-medium uppercase tracking-wider mt-1">
                  {t('events')}
                </p>
              </motion.div>

              {/* Locations */}
              <motion.div
                className="flex flex-col items-center sm:items-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isStatsInView ? 1 : 0,
                  y: isStatsInView ? 0 : 20
                }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.h3 className="font-bold text-green-800 text-3xl sm:text-6xl">
                  {locationsRounded}
                </motion.h3>
                <p className="text-xs sm:text-sm text-green-800 font-medium uppercase tracking-wider mt-1">
                  {t('locations')}
                </p>
              </motion.div>

              {/* Partnerships */}
              <motion.div
                className="flex flex-col items-center sm:items-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isStatsInView ? 1 : 0,
                  y: isStatsInView ? 0 : 20
                }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <motion.h3 className="font-bold text-green-800 text-3xl sm:text-6xl">
                  {partnershipsRounded}
                </motion.h3>
                <p className="text-xs sm:text-sm text-green-800 font-medium uppercase tracking-wider mt-1">
                  {t('partnerships')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>


      {/* Team profiles */}
      <div className={`w-full max-w-6xl mx-auto px-6 pb-16 ${isMobile ? 'mt-6' : 'mt-6'} mb-10`}
        onClick={() => setSelectedMember(null)}>
        <div className="grid grid-cols-5 gap-2 sm:gap-4"
          onClick={(e) => e.stopPropagation()}>
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleMemberClick(member)}
              animate={{
                opacity: selectedMember && selectedMember.name !== member.name ? 0.3 : 1,
                scale: selectedMember?.name === member.name ? 1.15 : 1
              }}
              transition={{ duration: 0.3 }}
              whileHover={!isMobile ? {
                scale: 1.15,
                zIndex: 10,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                  mass: 0.5
                }
              } : {}}
            >
              <motion.div
                className={`relative w-full aspect-square rounded-full overflow-hidden ${isMobile ? "max-w-[120px] sm:max-w-[100px] mb-2" : "mb-6"
                  }`}
                style={{ transformOrigin: 'center center' }}
                whileHover={!isMobile ? {
                  boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                } : {}}
              >
                <img
                  src={member.image}
                  alt={`${member.name} profile`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <div className="flex flex-col items-center">
                <motion.span
                  className={`text-gray-700 text-xs sm:text-sm text-center ${isMobile ? 'underline decoration-gray-400 decoration-1 underline-offset-2' : ''
                    }`}
                  animate={{
                    scale: selectedMember?.name === member.name ? 1.15 : 1,
                    fontWeight: selectedMember?.name === member.name ? 600 : 600
                  }}
                  transition={{ duration: 0.3 }}
                  whileHover={!isMobile ? {
                    scale: 1.6,
                    fontWeight: 600,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 10
                    }
                  } : {}}
                >
                  {member.name}
                </motion.span>
                <motion.span
                  className="text-gray-500 text-[10px] sm:text-xs text-center mt-1"
                  animate={{
                    opacity: selectedMember && selectedMember.name !== member.name ? 0.3 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {member.role}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected member bio */}
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`${isMobile ? 'mt-8' : 'mt-16'} mx-auto max-w-3xl`}
          >
            <motion.blockquote
              className="text-gray-600 text-sm sm:text-base leading-relaxed px-4 italic border-l-4 border-gray-300 pl-4"
              style={{ textAlign: 'justify' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {selectedMember.bio}
            </motion.blockquote>
          </motion.div>
        )}
      </div>
    </section>
  );
}