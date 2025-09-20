import { collection, getDocs, query, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from './config';

// Function to initialize the database with sample events
export const initializeDatabase = async () => {
  try {
    // First check if we have a single event document from old initialization approach
    const singleEventRef = doc(db, 'events', 'current-event');
    const singleEventDoc = await getDoc(singleEventRef);
    
    if (singleEventDoc.exists()) {
      console.log('Legacy event document exists, will not overwrite');
    }
    
    // Check if there are already events in the database collection
    const eventsQuery = query(collection(db, 'events'));
    const querySnapshot = await getDocs(eventsQuery);
    
    if (!querySnapshot.empty) {
      console.log('Database already contains events, skipping initialization');
      return;
    }
    
    console.log('Initializing database with sample events...');
    
    // Events of type "hunt"
    const huntEvents = [
      {
        title: "Urban Photography Adventure: City Lights",
        type: "hunt",
        date: "April 20, 2025",
        time: "6:00 PM - 9:00 PM",
        location: "Downtown Central Plaza",
        description: "Join us for a magical evening photography walk through the city. Capture the urban landscape as it transforms with the setting sun and city lights. Perfect for all photography levels!",
        spots: 15,
        spotsLeft: 15,
        image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: "Street Photography Hunt: Hidden Corners",
        type: "hunt",
        date: "May 5, 2025",
        time: "10:00 AM - 1:00 PM",
        location: "Historic District",
        description: "Explore the hidden corners and secret spots of our historic district. Focus on architecture, textures, and street life. A great opportunity to develop your eye for detail.",
        spots: 12,
        spotsLeft: 12,
        image: "https://images.unsplash.com/photo-1570168897322-7a5e2141b3e1?q=80&w=600&auto=format",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];
    
    // Events of type "workshop"
    const workshopEvents = [
      {
        title: "Portrait Photography Masterclass",
        type: "workshop",
        date: "April 25, 2025",
        time: "2:00 PM - 6:00 PM",
        location: "Photography Studio Central",
        description: "Learn advanced portrait photography techniques with professional lighting equipment. This hands-on workshop will cover composition, lighting setups, and how to connect with your subject.",
        spots: 8,
        spotsLeft: 8,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: "Mobile Photography Techniques",
        type: "workshop",
        date: "May 12, 2025",
        time: "4:00 PM - 7:00 PM",
        location: "Green Park Pavilion",
        description: "Discover how to take professional-quality photos with just your smartphone. We'll cover apps, techniques, and simple editing to make your mobile photography stand out on social media.",
        spots: 20,
        spotsLeft: 20,
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];
    
    // Events of type "exhibition"
    const exhibitionEvents = [
      {
        title: "Urban Perspectives: Community Photo Exhibition",
        type: "exhibition",
        date: "June 10, 2025",
        time: "7:00 PM - 10:00 PM",
        location: "Modern Art Gallery",
        description: "A curated exhibition featuring the best works from our community photography hunts. Join us for the opening night with drinks, music, and inspiring conversations with fellow photographers.",
        spots: 50,
        spotsLeft: 50,
        image: "https://images.unsplash.com/photo-1553547272-0cb9c602b4b1?q=80&w=600&auto=format",
        status: "upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    // Events of type "walk"
    const walkEvents = [
      {
        title: "Urban walk: Community Photo walk",
        type: "walk",
        date: "June 11, 2025",
        time: "7:00 PM - 10:00 PM",
        location: "Modern walk",
        description: "A curated walk featuring the best works from our community photography hunts. Join us for the opening night with drinks, music, and inspiring conversations with fellow photographers.",
        spots: 50,
        spotsLeft: 50,
        image: "https://images.unsplash.com/photo-1553547272-0cb9c602b4b1?q=80&w=600&auto=format",
        status: "upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];
    
    // Combine all events
    const allEvents = [...huntEvents, ...workshopEvents, ...exhibitionEvents, ...walkEvents];
    
    // Add events to the database
    const promises = allEvents.map(event => addDoc(collection(db, 'events'), event));
    await Promise.all(promises);
    
    console.log(`Database initialized successfully with ${allEvents.length} events`);
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};