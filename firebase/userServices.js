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
  const currentYear = new Date().getFullYear();
  
  // If user doesn't exist, create it
  if (!userDoc.exists()) {
    console.log('Creating new user profile for:', user.displayName || user.email);
    
    const newUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: 'user', // Keep role separate from membership
      membershipYears: [], // Empty until they actually book something
      currentYearMember: false, // False until they book in current year
      lastBookingYear: null, // Track last booking year
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      eventsBooked: [],
      // These fields will be filled during first booking
      name: null,
      surname: null,
      birthDate: null,
      address: null,
      taxId: null,
      instagram: null,
      // Track when personal details were last confirmed
      personalDetailsLastConfirmed: null
    };
    
    await setDoc(userRef, newUser);
    return newUser;
  } else {
    // If user exists, update some information and check year membership
    const userData = userDoc.data();
    const membershipYears = userData.membershipYears || [];
    const isCurrentYearMember = membershipYears.includes(currentYear);
    
    const updates = {
      displayName: user.displayName || userData.displayName,
      photoURL: user.photoURL || userData.photoURL,
      email: user.email || userData.email,
      currentYearMember: isCurrentYearMember,
      updatedAt: serverTimestamp()
    };
    
    // Only update if there are actual changes
    const hasChanges = 
      user.displayName !== userData.displayName || 
      user.photoURL !== userData.photoURL ||
      user.email !== userData.email ||
      isCurrentYearMember !== userData.currentYearMember;
    
    if (hasChanges) {
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

// Check if user needs to confirm personal details for current year
export const checkPersonalDetailsConfirmationNeeded = async (userId) => {
if (!userId) return { needed: false, reason: 'No user ID' };

try {
  const userProfile = await getUserProfile(userId);
  if (!userProfile) return { needed: true, reason: 'No user profile found' };
  
  const currentYear = new Date().getFullYear();
  const lastBookingYear = userProfile.lastBookingYear;
  const personalDetailsLastConfirmed = userProfile.personalDetailsLastConfirmed;
  
  // If user has never booked before, they need to fill everything
  if (!lastBookingYear) {
    return { 
      needed: true, 
      reason: 'first_time_user',
      isFirstTime: true
    };
  }
  
  // If last booking was in a different year, need confirmation
  if (lastBookingYear !== currentYear) {
    return { 
      needed: true, 
      reason: 'new_year_confirmation',
      isFirstTime: false,
      lastConfirmedYear: lastBookingYear
    };
  }
  
  // If personal details were never confirmed this year, need confirmation
  if (!personalDetailsLastConfirmed) {
    return { 
      needed: true, 
      reason: 'never_confirmed',
      isFirstTime: false
    };
  }
  
  // Check if personal details were confirmed this year
  const confirmationDate = personalDetailsLastConfirmed.toDate ? 
    personalDetailsLastConfirmed.toDate() : 
    new Date(personalDetailsLastConfirmed);
  
  const confirmationYear = confirmationDate.getFullYear();
  
  if (confirmationYear !== currentYear) {
    return { 
      needed: true, 
      reason: 'yearly_confirmation',
      isFirstTime: false,
      lastConfirmedYear: confirmationYear
    };
  }
  
  return { needed: false, reason: 'already_confirmed_this_year' };
} catch (error) {
  console.error('Error checking personal details confirmation:', error);
  return { needed: true, reason: 'error_checking' };
}
};

// Update user membership for current year (called when user makes a booking)
export const updateUserMembership = async (userId, personalDetails = null) => {
if (!userId) throw new Error('User ID is required');

try {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const currentYear = new Date().getFullYear();
  const userData = userDoc.data();
  const membershipYears = userData.membershipYears || [];
  
  // Add current year to membership if not already there
  const updatedMembershipYears = membershipYears.includes(currentYear) ? 
    membershipYears : 
    [...membershipYears, currentYear];
  
  const updates = {
    membershipYears: updatedMembershipYears,
    currentYearMember: true,
    lastBookingYear: currentYear,
    personalDetailsLastConfirmed: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  // Update personal details if provided
  if (personalDetails) {
    if (personalDetails.name) updates.name = personalDetails.name;
    if (personalDetails.surname) updates.surname = personalDetails.surname;
    if (personalDetails.birthDate) updates.birthDate = personalDetails.birthDate;
    if (personalDetails.address) updates.address = personalDetails.address;
    if (personalDetails.taxId) updates.taxId = personalDetails.taxId;
    if (personalDetails.instagram) updates.instagram = personalDetails.instagram;
    if (personalDetails.email) updates.email = personalDetails.email;
  }
  
  await updateDoc(userRef, updates);
  console.log(`Updated user ${userId} membership for year ${currentYear}`);
  return true;
} catch (error) {
  console.error('Error updating user membership:', error);
  throw error;
}
};

// Check if user has complete profile information
export const checkUserProfileComplete = async (userId) => {
if (!userId) return false;

try {
  const confirmationCheck = await checkPersonalDetailsConfirmationNeeded(userId);
  
  // If confirmation is needed, profile is not considered complete
  if (confirmationCheck.needed) {
    return false;
  }
  
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