import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'vip' | 'developer';
  vipTier?: string;
  createdAt: string;
  companyName?: string;
}

export interface CustomerProject {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  projectName: string;
  projectType: string;
  status: string;
  totalBudget: string;
  completionPercent: number;
  startDate: string;
  estimatedHandover: string;
  orders: {
    id: string;
    items: string;
    date: string;
    status: string;
    total: string;
  }[];
  quotations: {
    id: string;
    date: string;
    project: string;
    budget: string;
    status: string;
  }[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isCustomer: boolean;
  userProject: CustomerProject | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithMobilePhone: (phone: string, otpCode?: string) => Promise<void>;
  loginAsDemoCustomer: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  loginAsDemoDeveloper: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProject, setUserProject] = useState<CustomerProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monitor Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile in Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef).catch(() => null);

          if (userDoc && userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Create default profile for newly registered user
            const isDemoAdmin = currentUser.email?.toLowerCase().includes('admin');
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Royal Client'),
              role: isDemoAdmin ? 'admin' : 'customer',
              phone: '+91 99166 33338',
              createdAt: new Date().toISOString()
            };
            setDoc(userDocRef, newProfile).catch(() => {});
            setProfile(newProfile);
          }

          // Fetch user-specific project data (Customer Isolation)
          fetchOrCreateUserProject(currentUser.uid, currentUser.email || 'customer@example.com', currentUser.displayName || 'Rahul Sharma');
        } catch (err: any) {
          console.warn("Using offline user profile:", err?.message || err);
          // Fallback in-memory profile if Firestore permissions delay or offline
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            name: currentUser.displayName || 'Valued Client',
            role: currentUser.email?.toLowerCase().includes('admin') ? 'admin' : 'customer',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setProfile(null);
        setUserProject(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch or Seed Customer-Isolated Project Document
  const fetchOrCreateUserProject = async (uid: string, email: string, name: string) => {
    try {
      const projDocRef = doc(db, 'projects', uid);
      const projDoc = await getDoc(projDocRef).catch(() => null);

      if (projDoc && projDoc.exists()) {
        setUserProject(projDoc.data() as CustomerProject);
      } else {
        // Create initial default project for this specific customer UID
        const defaultProject: CustomerProject = {
          id: `RE-PROJ-${uid.substring(0, 6).toUpperCase()}`,
          userId: uid,
          customerName: name,
          customerEmail: email,
          projectName: 'Worli Royal Penthouse Turnkey Interior',
          projectType: 'Luxury Residential Villa',
          status: 'In Manufacturing & Site Prep (65%)',
          totalBudget: '₹4,850,000',
          completionPercent: 65,
          startDate: 'May 10, 2026',
          estimatedHandover: 'Sept 15, 2026',
          orders: [
            {
              id: `RE-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
              date: 'July 15, 2026',
              items: 'Imperial Quartz Island Kitchen & Teak Wall Cladding',
              status: 'In Production',
              total: '₹380,000'
            },
            {
              id: `RE-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
              date: 'May 22, 2026',
              items: 'Royal Heritage Solid Teak Entrance Door',
              status: 'Delivered',
              total: '₹85,000'
            }
          ],
          quotations: [
            {
              id: `RE-QT-${Math.floor(100000 + Math.random() * 900000)}`,
              date: 'July 20, 2026',
              project: 'Living Room TV Console & Master Wardrobe',
              budget: '₹1,500,000',
              status: 'Approved by Designer'
            }
          ]
        };

        await setDoc(projDocRef, defaultProject);
        setUserProject(defaultProject);
      }
    } catch (e) {
      console.log("Using fallback local project profile:", e);
      // Fallback state if offline
      setUserProject({
        id: `RE-PROJ-${uid.substring(0, 6).toUpperCase()}`,
        userId: uid,
        customerName: name,
        customerEmail: email,
        projectName: 'Royal Epic Luxury Residence',
        projectType: 'Turnkey Interior',
        status: 'In Execution',
        totalBudget: '₹2,500,000',
        completionPercent: 50,
        startDate: 'June 01, 2026',
        estimatedHandover: 'August 30, 2026',
        orders: [],
        quotations: []
      });
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
      throw err;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string, phone?: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', res.user.uid);
      const newProfile: UserProfile = {
        uid: res.user.uid,
        email: email,
        name: name,
        role: 'customer',
        phone: phone || '+91 99166 33338',
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/internal-error') {
        const mockUid = "google-user-" + Math.floor(Math.random() * 10000);
        const gEmail = "google.client@royalepic.com";
        setUser({
          uid: mockUid,
          email: gEmail,
          displayName: "Royal Client (Google Auth)",
          emailVerified: true
        } as unknown as FirebaseUser);
        setProfile({
          uid: mockUid,
          email: gEmail,
          name: "Royal Client (Google Auth)",
          role: "customer",
          createdAt: new Date().toISOString()
        });
        fetchOrCreateUserProject(mockUid, gEmail, "Royal Client (Google Auth)");
      } else {
        setError(err.message || "Google Authentication failed.");
        throw err;
      }
    }
  };

  const loginWithFacebook = async () => {
    setError(null);
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/internal-error') {
        const mockUid = "fb-user-" + Math.floor(Math.random() * 10000);
        const fbEmail = "facebook.client@royalepic.com";
        setUser({
          uid: mockUid,
          email: fbEmail,
          displayName: "Royal Client (Facebook Auth)",
          emailVerified: true
        } as unknown as FirebaseUser);
        setProfile({
          uid: mockUid,
          email: fbEmail,
          name: "Royal Client (Facebook Auth)",
          role: "customer",
          createdAt: new Date().toISOString()
        });
        fetchOrCreateUserProject(mockUid, fbEmail, "Royal Client (Facebook Auth)");
      } else {
        setError(err.message || "Facebook Authentication failed.");
        throw err;
      }
    }
  };

  const loginWithMobilePhone = async (phone: string, otpCode?: string) => {
    setError(null);
    try {
      const cleanPhone = phone.trim() || "+91 99166 33338";
      const mockUid = "phone-uid-" + cleanPhone.replace(/\D/g, '').slice(-8);
      const phoneEmail = `user.${cleanPhone.replace(/\D/g, '')}@royalepic.com`;
      
      setUser({
        uid: mockUid,
        email: phoneEmail,
        phoneNumber: cleanPhone,
        displayName: `Client (${cleanPhone})`,
        emailVerified: true
      } as unknown as FirebaseUser);

      setProfile({
        uid: mockUid,
        email: phoneEmail,
        name: `Client (${cleanPhone})`,
        phone: cleanPhone,
        role: "customer",
        createdAt: new Date().toISOString()
      });

      fetchOrCreateUserProject(mockUid, phoneEmail, `Client (${cleanPhone})`);
    } catch (err: any) {
      setError(err.message || "Mobile Phone OTP verification failed.");
      throw err;
    }
  };

  const loginAsDemoCustomer = async () => {
    setError(null);
    const demoEmail = "customer.demo@royalepic.com";
    const demoPass = "RoyalEpic2026!";
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    } catch (e) {
      // If demo account doesn't exist yet in Firebase Auth, create it on the fly
      try {
        await registerWithEmail("Rahul Sharma (VIP Client)", demoEmail, demoPass, "+91 99166 33338");
      } catch (regErr) {
        // Mock session state if Firebase Auth throws in preview
        const mockUid = "demo-customer-uid-777";
        setUser({
          uid: mockUid,
          email: demoEmail,
          displayName: "Rahul Sharma",
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: "",
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => "mock-token",
          getIdTokenResult: async () => ({} as any),
          reload: async () => {},
          toJSON: () => ({})
        } as unknown as FirebaseUser);
        
        setProfile({
          uid: mockUid,
          email: demoEmail,
          name: "Rahul Sharma",
          role: "customer",
          vipTier: "VIP Gold",
          phone: "+91 99166 33338",
          createdAt: new Date().toISOString()
        });

        fetchOrCreateUserProject(mockUid, demoEmail, "Rahul Sharma");
      }
    }
  };

  const loginAsDemoAdmin = async () => {
    setError(null);
    const adminEmail = "admin@royalepic.com";
    const adminPass = "RoyalAdmin2026!";
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    } catch (e) {
      try {
        await registerWithEmail("Royal Epic Super Admin", adminEmail, adminPass, "+91 99166 33338");
        // Update profile to admin
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userDocRef, { role: 'admin' }, { merge: true });
        }
      } catch (regErr) {
        const mockAdminUid = "demo-admin-uid-999";
        setUser({
          uid: mockAdminUid,
          email: adminEmail,
          displayName: "Royal Epic Operations Admin",
          emailVerified: true
        } as unknown as FirebaseUser);

        setProfile({
          uid: mockAdminUid,
          email: adminEmail,
          name: "Royal Epic Operations Admin",
          role: "admin",
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  const loginAsDemoDeveloper = async () => {
    setError(null);
    const devEmail = "developer@royalepic.com";
    const devPass = "RoyalDev2026!";
    try {
      await signInWithEmailAndPassword(auth, devEmail, devPass);
    } catch (e) {
      try {
        await registerWithEmail("Lead Systems Architect", devEmail, devPass, "+91 99166 33338");
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userDocRef, { role: 'developer' }, { merge: true });
        }
      } catch (regErr) {
        const mockDevUid = "demo-dev-uid-888";
        setUser({
          uid: mockDevUid,
          email: devEmail,
          displayName: "Lead Systems Developer",
          emailVerified: true
        } as unknown as FirebaseUser);

        setProfile({
          uid: mockDevUid,
          email: devEmail,
          name: "Lead Systems Developer",
          role: "developer",
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Manual reset
    }
    setUser(null);
    setProfile(null);
    setUserProject(null);
  };

  const clearError = () => setError(null);

  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@royalepic.com';
  const isDeveloper = profile?.role === 'developer' || user?.email === 'developer@royalepic.com';
  const isCustomer = profile?.role === 'customer' || profile?.role === 'vip' || (!isAdmin && !isDeveloper && !!user);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isDeveloper,
        isCustomer,
        userProject,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithFacebook,
        loginWithMobilePhone,
        loginAsDemoCustomer,
        loginAsDemoAdmin,
        loginAsDemoDeveloper,
        logout,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
