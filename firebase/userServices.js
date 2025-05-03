import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from './config';
  
  // Create or update a user profile after login/registration
export const createUserProfile = async (user) => {
  if (!user) return null;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    // If user doesn't exist, create it
    if (!userDoc.exists()) {
      console.log('Creating new user profile for:', user.displayName || user.email);
      
      const newUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        role: 'user', // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        eventsBooked: [],
        // These fields will be filled later during first booking
        name: null,
        surname: null,
        birthDate: null,
        address: null,
        taxId: null,
        instagram: null
      };
      
      await setDoc(userRef, newUser);
      return newUser;
    } else {
      // If user exists, only update some information
      const userData = userDoc.data();
      
      // Update only if necessary
      if (
        user.displayName !== userData.displayName || 
        user.photoURL !== userData.photoURL ||
        user.email !== userData.email
      ) {
        const updates = {
          displayName: user.displayName || userData.displayName,
          photoURL: user.photoURL || userData.photoURL,
          email: user.email || userData.email,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(userRef, updates);
        return { ...userData, ...updates };
      }
      
      return userData;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Check if user has complete profile information
export const checkUserProfileComplete = async (userId) => {
  if (!userId) return false;
  
  try {
    const userProfile = await getUserProfile(userId);
    
    // Check if user has all required fields
    return userProfile && 
           userProfile.name && 
           userProfile.surname && 
           userProfile.birthDate && 
           userProfile.address && 
           userProfile.taxId;
  } catch (error) {
    console.error('Error checking user profile completeness:', error);
    return false;
  }
};
  
  // Get current user profile
  export const getUserProfile = async (userId) => {
    if (!userId) return null;
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };
  
  // Promote a user to admin role (utility function)
  export const setUserAsAdmin = async (userId) => {
    if (!userId) throw new Error('User ID is required');
    
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
      
      console.log('User promoted to admin:', userId);
      return true;
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      throw error;
    }
  };