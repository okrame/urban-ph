import { useState, useRef, useEffect } from 'react';
import { uploadEventImage } from '../../firebase/storageServices';

function ImageUploader({ initialImage, onImageSelected, onImageUploaded, eventId }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useUrlFallback, setUseUrlFallback] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialImage) {
      setPreview(initialImage);
    }
  }, [initialImage]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
      e.dataTransfer.clearData();
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (5MB limit for Storage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size too large. Please upload an image under 5MB.');
      return;
    }

    setFile(file);
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Pass file to parent for temporary storage
    if (onImageSelected) {
      onImageSelected(file);
    }

    // If eventId is provided, try to upload to Storage
    if (eventId && !useUrlFallback) {
      await uploadImage(file);
    }
  };

  const uploadImage = async (fileToUpload = file) => {
    if (!fileToUpload || !eventId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const downloadURL = await uploadEventImage(fileToUpload, eventId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Pass URL to parent
      if (onImageUploaded) {
        onImageUploaded(downloadURL);
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error("Error uploading image:", error);
      clearInterval(progressInterval);
      
      // Show fallback options
      setIsUploading(false);
      setUploadProgress(0);
      setUseUrlFallback(true);
      
      alert(`Storage upload failed: ${error.message}\n\nPlease use an image URL instead or configure Firebase Storage.`);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    const urlInput = e.target.imageUrl.value.trim();
    
    if (!urlInput) {
      alert('Please enter a valid image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
      if (onImageUploaded) {
        onImageUploaded(urlInput);
      }
      setPreview(urlInput);
      setUseUrlFallback(false);
    } catch {
      alert('Please enter a valid URL');
    }
  };

  const handleClick = () => {
    if (!useUrlFallback) {
      fileInputRef.current.click();
    }
  };

  const clearImage = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview('');
    setUseUrlFallback(false);
    
    if (onImageSelected) {
      onImageSelected(null);
    }
    
    if (onImageUploaded) {
      onImageUploaded(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // If using URL fallback, show URL input
  if (useUrlFallback) {
    return (
      <div className="w-full">
        <div className="border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg p-4">
          <div className="text-center mb-4">
            <p className="text-orange-700 font-medium">Storage Upload Failed</p>
            <p className="text-sm text-orange-600">Please enter an image URL instead:</p>
          </div>
          
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <input
              type="url"
              name="imageUrl"
              placeholder="https://example.com/image.jpg"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={() => setUseUrlFallback(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              >
                Try Upload Again
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${preview ? 'h-auto' : 'h-44'}`}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*"
          onChange={handleFileInput}
        />
        
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 text-blue-500" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-blue-500"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (uploadProgress / 100) * 251.2}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-500">{uploadProgress}%</span>
                </div>
              </div>
              <p className="text-sm mt-2">
                {uploadProgress < 50 ? 'Checking for duplicates...' : 'Uploading to Storage...'}
              </p>
            </div>
          </div>
        )}
        
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-auto max-h-64 object-contain mx-auto rounded" 
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
            </svg>
            <p className="text-sm mb-1">Drag & drop an image or click to browse</p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUseUrlFallback(true);
              }}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Or use image URL instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUploader;