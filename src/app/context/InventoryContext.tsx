import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Interface matching the actual database schema
export interface InventoryItem {
  item_id: number;
  display_name: string;
  nick_name: string;
  sku: string;
  in_stock: number;
  desired_stock: number;
  recomend_use: number;
  photo_link: string;
  item_type?: 'unit' | 'package';
  pack_size?: number;
  created_at?: string;
}

export interface Transaction {
  transaction_id: number;
  item_id: number;
  transaction_type: 'stock_out' | 'return' | 'stock_in';
  removed_by_id?: number;
  received_by_id?: number;
  quantity: number;
  transaction_date: string;
  items?: {
    display_name: string;
    sku: string;
    photo_link: string;
  };
  removed_by?: {
    full_name: string;
    role: string;
  };
  received_by?: {
    full_name: string;
    role: string;
  };
}

export interface Profile {
  employee_id: number;
  full_name: string;
  role: string;
  created_at: string;
}

export interface Organization {
  org_id: string;
  name: string;
  slug?: string;
  invite_code?: string;
}

export interface NewItemData {
  display_name: string;
  nick_name: string;
  sku: string;
  in_stock: number;
  desired_stock: number;
  recomend_use: number;
  item_type: 'unit' | 'package';
  pack_size: number;
}

interface InventoryContextType {
  items: InventoryItem[];
  transactions: Transaction[];
  transactionsTotal: number;
  transactionCounts: { all: number; stock_out: number; return: number; stock_in: number };
  hasMoreTransactions: boolean;
  profiles: Profile[];
  currentUser: any;
  currentProfile: Profile | null;
  currentOrg: Organization | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUpCreateOrg: (email: string, password: string, name: string, orgName: string) => Promise<void>;
  signUpJoinOrg: (email: string, password: string, name: string, inviteCode: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchTransactions: (itemId?: string) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  fetchProfiles: () => Promise<void>;
  createStockOut: (itemId: number, quantity: number, removedById: number, receivedById: number) => Promise<void>;
  createReturn: (itemId: number, quantity: number, removedById: number, receivedById: number) => Promise<void>;
  createStockIn: (itemId: number, quantity: number, employeeId: number) => Promise<void>;
  batchStockOut: (items: Array<{itemId: number, quantity: number}>, removedById: number, receivedById: number) => Promise<void>;
  batchReturn: (items: Array<{itemId: number, quantity: number}>, removedById: number, receivedById: number) => Promise<void>;
  batchStockIn: (items: Array<{itemId: number, quantity: number}>, employeeId: number) => Promise<void>;
  updateItem: (id: number, updates: Partial<InventoryItem>) => Promise<void>;
  createItem: (data: NewItemData, photoFile: File) => Promise<void>;
  uploadItemPhoto: (file: File) => Promise<string>;
  getItemById: (id: number) => InventoryItem | undefined;
}

const TRANSACTIONS_PAGE_SIZE = 50;

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionCounts, setTransactionCounts] = useState({ all: 0, stock_out: 0, return: 0, stock_in: 0 });
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // A ref mirrors the token so functions called right after sign-in (before
  // React re-renders) always read the fresh value instead of a stale closure.
  const accessTokenRef = useRef<string | null>(null);
  const setAccessToken = (token: string | null) => {
    accessTokenRef.current = token;
    setAccessTokenState(token);
  };

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error checking session:', error);
        setLoading(false);
        return;
      }

      if (session) {
        setCurrentUser(session.user);
        setAccessToken(session.access_token);
        await fetchMe();
        await fetchItems();
        await fetchTransactions();
        await fetchProfiles();
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Exception checking session:', error);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!session) {
        throw new Error('No session returned');
      }

      setCurrentUser(session.user);
      setAccessToken(session.access_token);

      await fetchMe();
      await fetchItems();
      await fetchTransactions();
      await fetchProfiles();
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signUpCreateOrg = async (email: string, password: string, name: string, orgName: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/auth/signup-org`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name, orgName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      await signIn(email, password);
    } catch (error) {
      console.error('❌ Sign up (create org) error:', error);
      throw error;
    }
  };

  const signUpJoinOrg = async (email: string, password: string, name: string, inviteCode: string, role: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/auth/signup-join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name, inviteCode, role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join organization');
      }

      await signIn(email, password);
    } catch (error) {
      console.error('❌ Sign up (join org) error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setCurrentProfile(null);
      setCurrentOrg(null);
      setAccessToken(null);
      setItems([]);
      setTransactions([]);
      setProfiles([]);
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  const fetchMe = useCallback(async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch current user');
      }

      setCurrentProfile(data.profile || null);
      setCurrentOrg(data.organization || null);
    } catch (error) {
      console.error('❌ Error fetching /me:', error);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/items`,
        {
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch items');
      }

      const fetchedItems: InventoryItem[] = data.items || [];
      setItems(fetchedItems);

      // Preload all item images into memory so they don't flash on page navigation
      fetchedItems.forEach(item => {
        if (item.photo_link) {
          const img = new Image();
          img.src = item.photo_link;
        }
      });
    } catch (error) {
      console.error('❌ Error fetching items:', error);
      throw error;
    }
  }, []);

  const fetchTransactions = useCallback(async (itemId?: string) => {
    try {
      const url = new URL(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions`
      );
      url.searchParams.append('limit', String(TRANSACTIONS_PAGE_SIZE));
      url.searchParams.append('offset', '0');
      if (itemId) url.searchParams.append('item_id', itemId);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessTokenRef.current}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.transactions || []);
      setTransactionsTotal(data.total ?? 0);
      setHasMoreTransactions(data.hasMore ?? false);
      if (data.counts) setTransactionCounts(data.counts);
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      throw error;
    }
  }, []);

  const transactionsLengthRef = useRef(0);
  transactionsLengthRef.current = transactions.length;

  const loadMoreTransactions = useCallback(async () => {
    try {
      const url = new URL(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions`
      );
      url.searchParams.append('limit', String(TRANSACTIONS_PAGE_SIZE));
      url.searchParams.append('offset', String(transactionsLengthRef.current));

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessTokenRef.current}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch transactions');

      setTransactions(prev => [...prev, ...(data.transactions || [])]);
      setTransactionsTotal(data.total ?? 0);
      setHasMoreTransactions(data.hasMore ?? false);
    } catch (error) {
      console.error('❌ Error loading more transactions:', error);
      throw error;
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/profiles`,
        {
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profiles');
      }

      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('❌ Error fetching profiles:', error);
    }
  }, []);

  const createStockOut = async (itemId: number, quantity: number, removedById: number, receivedById: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions/stock-out`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: itemId, quantity, removed_by_id: removedById, received_by_id: receivedById }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create stock out');
      }

      await fetchItems();
      await fetchTransactions();
    } catch (error: any) {
      console.error('❌ Error creating stock out:', error);
      throw error;
    }
  };

  const createReturn = async (itemId: number, quantity: number, removedById: number, receivedById: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions/return`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: itemId, quantity, removed_by_id: removedById, received_by_id: receivedById }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create return');
      }

      await fetchItems();
      await fetchTransactions();
    } catch (error: any) {
      console.error('❌ Error creating return:', error);
      throw error;
    }
  };

  const createStockIn = async (itemId: number, quantity: number, employeeId: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions/stock-in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: itemId, quantity, employee_id: employeeId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create stock in');
      }

      await fetchItems();
      await fetchTransactions();
    } catch (error) {
      console.error('❌ Error creating stock in:', error);
      throw error;
    }
  };

  const updateItem = async (id: number, updates: Partial<InventoryItem>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/items/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update item');
      }

      await fetchItems();
    } catch (error) {
      console.error('❌ Error updating item:', error);
      throw error;
    }
  };

  const batchStockOut = async (
    items: Array<{itemId: number, quantity: number}>,
    removedById: number,
    receivedById: number
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions/batch/stock-out`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map(({ itemId, quantity }) => ({ item_id: itemId, quantity })),
            removed_by_id: removedById,
            received_by_id: receivedById,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create batch stock out');

      setItems(prev => prev.map(item => {
        const delivered = items.find(i => i.itemId === item.item_id);
        return delivered ? { ...item, in_stock: Math.max(0, item.in_stock - delivered.quantity) } : item;
      }));
      setTransactions([]);
    } catch (error: any) {
      console.error('❌ Error in batch stock out:', error);
      throw error;
    }
  };

  const batchReturn = async (
    items: Array<{itemId: number, quantity: number}>,
    removedById: number,
    receivedById: number
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions/batch/return`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map(({ itemId, quantity }) => ({ item_id: itemId, quantity })),
            removed_by_id: removedById,
            received_by_id: receivedById,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create batch return');

      setItems(prev => prev.map(item => {
        const returned = items.find(i => i.itemId === item.item_id);
        return returned ? { ...item, in_stock: item.in_stock + returned.quantity } : item;
      }));
      setTransactions([]);
    } catch (error: any) {
      console.error('❌ Error in batch return:', error);
      throw error;
    }
  };

  const batchStockIn = async (
    items: Array<{itemId: number, quantity: number}>,
    employeeId: number
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/transactions/batch/stock-in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessTokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map(({ itemId, quantity }) => ({ item_id: itemId, quantity })),
            employee_id: employeeId,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create batch stock in');

      setItems(prev => prev.map(item => {
        const purchased = items.find(i => i.itemId === item.item_id);
        return purchased ? { ...item, in_stock: item.in_stock + purchased.quantity } : item;
      }));
      setTransactions([]);
    } catch (error: any) {
      console.error('❌ Error in batch stock in:', error);
      throw error;
    }
  };

  const uploadItemPhoto = async (file: File): Promise<string> => {
    const compressed = await compressPhoto(file);
    const form = new FormData();
    form.append('photo', new File([compressed], 'photo.webp', { type: 'image/webp' }));
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/items/upload-photo`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${accessTokenRef.current}` }, body: form }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Falha ao fazer upload da foto');
    return result.url;
  };

  const compressPhoto = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
        } else {
          if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Falha ao comprimir imagem')),
          'image/webp',
          0.75
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Falha ao ler imagem')); };
      img.src = objectUrl;
    });

  const createItem = async (data: NewItemData, photoFile: File) => {
    try {
      // Derive next item_id from the highest known id
      // Step 1: compress + upload photo
      const compressed = await compressPhoto(photoFile);
      const form = new FormData();
      form.append('photo', new File([compressed], 'photo.webp', { type: 'image/webp' }));

      const uploadResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/items/upload-photo`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessTokenRef.current}` },
          body: form,
        }
      );
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadResult.error || 'Falha ao fazer upload da foto');

      // Step 2: create item with photo_link
      const createResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-264019ad/items`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessTokenRef.current}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, photo_link: uploadResult.url }),
        }
      );
      const createResult = await createResponse.json();
      if (!createResponse.ok) throw new Error(createResult.error || 'Falha ao criar item');

      const newItem: InventoryItem = createResult.item;
      setItems(prev => [...prev, newItem].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      const img = new Image();
      img.src = newItem.photo_link;
    } catch (error) {
      console.error('❌ Error creating item:', error);
      throw error;
    }
  };

  const getItemById = (id: number) => items.find(item => item.item_id === id);

  return (
    <InventoryContext.Provider
      value={{
        items,
        transactions,
        transactionsTotal,
        transactionCounts,
        hasMoreTransactions,
        profiles,
        currentUser,
        currentProfile,
        currentOrg,
        accessToken,
        loading,
        signIn,
        signUpCreateOrg,
        signUpJoinOrg,
        signOut,
        fetchItems,
        fetchTransactions,
        loadMoreTransactions,
        fetchProfiles,
        createStockOut,
        createReturn,
        createStockIn,
        batchStockOut,
        batchReturn,
        batchStockIn,
        updateItem,
        createItem,
        uploadItemPhoto,
        getItemById,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
