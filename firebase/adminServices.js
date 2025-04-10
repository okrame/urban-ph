import { 
    collection, 
    doc, 
    addDoc,
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,  
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from './config';
  
  // =============== GESTIONE ADMIN ===============
  
  // Verifica se un utente è admin
  export const isUserAdmin = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return false;
      }
      
      const userData = userDoc.data();
      return userData.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };
  
  // Promuovi un utente ad admin
  export const promoteUserToAdmin = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      await updateDoc(userRef, {
        role: 'admin',
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      throw error;
    }
  };
  
  // =============== GESTIONE EVENTI ===============
  
  // Crea un nuovo evento (solo admin)
  export const createNewEvent = async (eventData) => {
    try {
      const newEvent = {
        ...eventData,
        status: eventData.status || 'active',
        spotsLeft: eventData.spots,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Validazione dei campi obbligatori
      const requiredFields = ['title', 'type', 'date', 'time', 'location', 'description', 'spots', 'image'];
      for (const field of requiredFields) {
        if (!newEvent[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Validazione del tipo
      const validTypes = ['hunt', 'workshop', 'exhibition'];
      if (!validTypes.includes(newEvent.type)) {
        throw new Error(`Invalid event type: ${newEvent.type}. Must be one of: ${validTypes.join(', ')}`);
      }
      
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      return docRef.id;
    } catch (error) {
      console.error('Error creating new event:', error);
      throw error;
    }
  };
  
  // Elimina un evento (solo admin)
  export const deleteEvent = async (eventId) => {
    try {
      // Verifica se l'evento esiste
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }
      
      // Verifica se ci sono prenotazioni
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('eventId', '==', eventId)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      if (!bookingsSnapshot.empty) {
        // Se ci sono prenotazioni, elimina anche quelle
        const deleteBookingPromises = [];
        
        bookingsSnapshot.forEach(doc => {
          deleteBookingPromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deleteBookingPromises);
      }
      
      // Elimina l'evento
      await deleteDoc(eventRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };
  
  // =============== REPORTISTICA AVANZATA ===============
  
  // Ottieni statistiche dettagliate degli eventi
  export const getDetailedEventsStats = async () => {
    try {
      // Query per eventi per tipo
      const huntQuery = query(
        collection(db, 'events'), 
        where('type', '==', 'hunt')
      );
      
      const workshopQuery = query(
        collection(db, 'events'), 
        where('type', '==', 'workshop')
      );
      
      const exhibitionQuery = query(
        collection(db, 'events'), 
        where('type', '==', 'exhibition')
      );
      
      // Query per eventi per stato
      const activeQuery = query(
        collection(db, 'events'), 
        where('status', '==', 'active')
      );
      
      const pastQuery = query(
        collection(db, 'events'), 
        where('status', '==', 'past')
      );
      
      const upcomingQuery = query(
        collection(db, 'events'), 
        where('status', '==', 'upcoming')
      );
      
      // Esegui tutte le query in parallelo
      const [
        huntEvents, 
        workshopEvents, 
        exhibitionEvents,
        activeEvents,
        pastEvents,
        upcomingEvents
      ] = await Promise.all([
        getDocs(huntQuery),
        getDocs(workshopQuery),
        getDocs(exhibitionQuery),
        getDocs(activeQuery),
        getDocs(pastQuery),
        getDocs(upcomingQuery)
      ]);
      
      // Query per prenotazioni totali
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      
      // Ritorna le statistiche
      return {
        eventsByType: {
          hunt: huntEvents.size,
          workshop: workshopEvents.size,
          exhibition: exhibitionEvents.size
        },
        eventsByStatus: {
          active: activeEvents.size,
          past: pastEvents.size,
          upcoming: upcomingEvents.size
        },
        totalEvents: huntEvents.size + workshopEvents.size + exhibitionEvents.size,
        totalBookings: bookingsSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching detailed events stats:', error);
      throw error;
    }
  };
  
  // Esporta dati completi per analisi
  export const exportCompleteData = async () => {
    try {
      // Ottieni tutti gli eventi
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const events = [];
      
      eventsSnapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Ottieni tutte le prenotazioni
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookings = [];
      
      bookingsSnapshot.forEach(doc => {
        bookings.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Ottieni tutti gli utenti
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      
      usersSnapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Costruisci un report completo
      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalEvents: events.length,
          totalUsers: users.length,
          totalBookings: bookings.length,
          eventsByType: events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
          }, {}),
          eventsByStatus: events.reduce((acc, event) => {
            acc[event.status] = (acc[event.status] || 0) + 1;
            return acc;
          }, {})
        },
        events,
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
          eventsBooked: user.eventsBooked || []
        })),
        bookings
      };
      
      return report;
    } catch (error) {
      console.error('Error exporting complete data:', error);
      throw error;
    }
  };