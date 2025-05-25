import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { app } from './config';

const storage = getStorage(app);

// Generate simple hash from file content
const generateFileHash = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // Use first 16 chars for shorter hash
};

// Check if file with same hash already exists
const findExistingImage = async (fileHash) => {
  try {
    const imagesRef = ref(storage, 'event-images/');
    const result = await listAll(imagesRef);
    
    // Check all folders for files with matching hash
    for (const folderRef of result.prefixes) {
      const folderResult = await listAll(folderRef);
      for (const itemRef of folderResult.items) {
        if (itemRef.name.includes(`_${fileHash}_`)) {
          // Found existing file with same hash
          return await getDownloadURL(itemRef);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error checking for existing images:', error);
    return null;
  }
};

// Upload image to Firebase Storage with deduplication
export const uploadEventImage = async (file, eventId) => {
  try {
    if (!file) throw new Error('No file provided');
    
    // Generate hash for deduplication
    const fileHash = await generateFileHash(file);
    
    // Check if image already exists
    const existingURL = await findExistingImage(fileHash);
    if (existingURL) {
      console.log('Image already exists, reusing:', existingURL);
      return existingURL;
    }
    
    // Create unique filename with hash
    const timestamp = Date.now();
    const fileName = `${timestamp}_${fileHash}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Create reference
    const imageRef = ref(storage, `event-images/${eventId}/${fileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(imageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('New image uploaded:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Firebase Storage
export const deleteEventImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('firebase')) {
      return; // Not a Firebase Storage URL
    }
    
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deletion failures shouldn't block other operations
  }
};