import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './config';

// Function to initialize the Firestore database with initial data
export const initializeFirestore = async () => {
  try {
    // First check if the document already exists to avoid overwriting data
    const docRef = doc(db, 'events', 'current-event');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('Document already exists, not overwriting');
      return;
    }
    
    // Create the current event document only if it doesn't exist
    await setDoc(docRef, {
      title: "Urban Photography Adventure: City Lights",
      date: "April 20, 2025",
      time: "6:00 PM - 9:00 PM",
      location: "Downtown Central Plaza",
      description: "Join us for a magical evening photography walk through the city. Capture the urban landscape as it transforms with the setting sun and city lights. Perfect for all photography levels!",
      spots: 15,
      spotsLeft: 8,
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format",
      attendees: []
    });
    
    console.log('Firestore initialized successfully');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error; // Re-throw to handle in the calling component
  }
};