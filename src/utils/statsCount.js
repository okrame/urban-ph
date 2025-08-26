import { collection, getDocs, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Fetches the current number of users from Firebase publicStats
 * @returns {Promise<number>} The total number of users
 */
export const getCurrentUsersCount = async () => {
  try {
    const statsRef = doc(db, 'publicStats', 'userCount');
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return data.count || 244;
    } else {
      console.warn('publicStats/userCount document not found');
      return 244;
    }
  } catch (error) {
    console.error('Error fetching users count:', error);
    // Return fallback number if Firebase fails
    return 244;
  }
};


export const updatePublicUserCount = async () => {
  try {
    // Count actual users
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    const userCount = snapshot.size;
    
    // Update public stats document
    const statsRef = doc(db, 'publicStats', 'userCount');
    await setDoc(statsRef, {
      count: userCount,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log(`Updated public user count to: ${userCount}`);
    return true;
  } catch (error) {
    console.error('Error updating public user count:', error);
    return false;
  }
};