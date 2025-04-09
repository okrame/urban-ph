import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

function Navbar({ user }) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">Urban Photo Hunts</div>
        
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:block">Hello, {user.displayName || user.email}</span>
              <button 
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <span>Welcome, Guest</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;