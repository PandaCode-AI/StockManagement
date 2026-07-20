import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Custom logger function that won't interfere with responses
const customLogger = (message: string, ...args: any[]) => {
  console.log(message, ...args);
};

// Enable logger
app.use('*', logger(customLogger));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-264019ad/health", (c) => {
  return c.json({ status: "ok" });
});

// Jobs XML feed endpoint
app.get("/make-server-264019ad/jobs.xml", (c) => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>Your HR Software Name</publisher>
  <publisherurl>https://yourapp.com</publisherurl>
  <job>
    <title><![CDATA[Software Engineer]]></title>
    <date><![CDATA[Tue, 19 May 2026 00:00:00 GMT]]></date>
    <referencenumber><![CDATA[JOB-001]]></referencenumber>
    <url><![CDATA[https://yourapp.com/jobs/001]]></url>
    <company><![CDATA[Acme Corp]]></company>
    <city><![CDATA[Belo Horizonte]]></city>
    <state><![CDATA[MG]]></state>
    <country><![CDATA[BR]]></country>
    <description><![CDATA[Full job description here...]]></description>
    <salary><![CDATA[R$8.000 - R$12.000/month]]></salary>
  </job>
</source>`;

  return c.body(xmlContent, 200, {
    'Content-Type': 'application/xml; charset=utf-8',
  });
});

// ==================== AUTH ROUTES ====================

// Sign up new user (creates profile in database)
app.post("/make-server-264019ad/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    console.log('📝 Creating user:', email);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { name, email, role }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);

      // Provide user-friendly error messages
      if (authError.message.includes('already been registered') || authError.status === 422) {
        return c.json({ error: 'Este email já está cadastrado no sistema' }, 400);
      }

      return c.json({ error: authError.message }, 400);
    }

    // Create profile in database
    const { error: profileError } = await supabaseAdmin
      .from('profile')
      .insert({
        full_name: name,
        role: role || 'Cleaner'
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return c.json({ error: profileError.message }, 400);
    }

    console.log('✅ User created successfully');
    return c.json({ 
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role
      }
    });
  } catch (error) {
    console.error('❌ Signup exception:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// ==================== ITEMS ROUTES ====================

// Get all items
app.get("/make-server-264019ad/items", async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .order('display_name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching items:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ items: data || [] });
  } catch (error) {
    console.error('❌ Exception fetching items:', error);
    return c.json({ error: 'Failed to fetch items' }, 500);
  }
});

// Get single item by ID
app.get("/make-server-264019ad/items/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('item_id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching item:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ item: data });
  } catch (error) {
    console.error('❌ Exception fetching item:', error);
    return c.json({ error: 'Failed to fetch item' }, 500);
  }
});

// Create new item
app.post("/make-server-264019ad/items", async (c) => {
  try {
    const itemData = await c.req.json();
    
    const { data, error } = await supabaseAdmin
      .from('items')
      .insert(itemData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating item:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ Item created:', data.item_id);
    return c.json({ item: data });
  } catch (error) {
    console.error('❌ Exception creating item:', error);
    return c.json({ error: 'Failed to create item' }, 500);
  }
});

// Update item
app.put("/make-server-264019ad/items/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const { data, error } = await supabaseAdmin
      .from('items')
      .update(updates)
      .eq('item_id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating item:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ Item updated:', id);
    return c.json({ item: data });
  } catch (error) {
    console.error('❌ Exception updating item:', error);
    return c.json({ error: 'Failed to update item' }, 500);
  }
});

// Delete item
app.delete("/make-server-264019ad/items/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const { error } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('item_id', id);

    if (error) {
      console.error('❌ Error deleting item:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ Item deleted:', id);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Exception deleting item:', error);
    return c.json({ error: 'Failed to delete item' }, 500);
  }
});

// ==================== TRANSACTIONS ROUTES ====================

// Get all transactions (with filters and pagination)
app.get("/make-server-264019ad/transactions", async (c) => {
  try {
    const itemId = c.req.query('item_id');
    const type = c.req.query('type');
    const supervisorId = c.req.query('supervisor_id');
    const cleanerId = c.req.query('cleaner_id');
    const dateFrom = c.req.query('date_from');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
    const offset = parseInt(c.req.query('offset') || '0');

    const selectFields = `
      transaction_id,
      item_id,
      transaction_type,
      quantity,
      transaction_date,
      removed_by_id,
      received_by_id,
      items:item_id (
        display_name,
        sku,
        photo_link
      ),
      removed_by:removed_by_id (
        full_name,
        role
      ),
      received_by:received_by_id (
        full_name,
        role
      )
    `;

    // Base filters shared by data query and count queries (excludes type filter)
    const applyBaseFilters = (q: any) => {
      if (itemId) q = q.eq('item_id', itemId);
      if (dateFrom) q = q.gte('transaction_date', dateFrom);
      if (supervisorId) q = q.or(`removed_by_id.eq.${supervisorId},received_by_id.eq.${supervisorId}`);
      if (cleanerId) q = q.or(`removed_by_id.eq.${cleanerId},received_by_id.eq.${cleanerId}`);
      return q;
    };

    const buildCountQuery = (filterType?: string) => {
      let q = supabaseAdmin
        .from('inventory_transactions')
        .select('*', { count: 'exact', head: true });
      q = applyBaseFilters(q);
      if (filterType) q = q.eq('transaction_type', filterType);
      return q;
    };

    let dataQuery = supabaseAdmin
      .from('inventory_transactions')
      .select(selectFields, { count: 'exact' })
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    dataQuery = applyBaseFilters(dataQuery);
    if (type) dataQuery = dataQuery.eq('transaction_type', type);

    const [
      { data, error, count },
      { count: stockOutCount },
      { count: returnCount },
      { count: stockInCount },
    ] = await Promise.all([
      dataQuery,
      buildCountQuery('stock_out'),
      buildCountQuery('return'),
      buildCountQuery('stock_in'),
    ]);

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      return c.json({ error: error.message }, 400);
    }

    const total = count ?? 0;
    return c.json({
      transactions: data || [],
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      counts: {
        all: (stockOutCount ?? 0) + (returnCount ?? 0) + (stockInCount ?? 0),
        stock_out: stockOutCount ?? 0,
        return: returnCount ?? 0,
        stock_in: stockInCount ?? 0,
      },
    });
  } catch (error) {
    console.error('❌ Exception fetching transactions:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// Create transaction (stock out - entrega)
app.post("/make-server-264019ad/transactions/stock-out", async (c) => {
  try {
    const { item_id, quantity, removed_by_id, received_by_id } = await c.req.json();

    // Get current stock
    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('in_stock')
      .eq('item_id', item_id)
      .single();

    if (itemError || !item) {
      return c.json({ error: 'Item not found' }, 404);
    }

    if (item.in_stock < quantity) {
      return c.json({ error: 'Insufficient stock' }, 400);
    }

    // Create transaction
    const { data: transaction, error: transError } = await supabaseAdmin
      .from('inventory_transactions')
      .insert({
        item_id,
        removed_by_id,
        received_by_id,
        transaction_type: 'stock_out',
        quantity
      })
      .select()
      .single();

    if (transError) {
      console.error('❌ Error creating transaction:', transError);
      return c.json({ error: transError.message }, 400);
    }

    // Update stock
    const newStock = Number(item.in_stock) - Number(quantity);
    const { error: updateError } = await supabaseAdmin
      .from('items')
      .update({ in_stock: newStock })
      .eq('item_id', item_id);

    if (updateError) {
      console.error('❌ Error updating stock:', updateError);
      return c.json({ error: updateError.message }, 400);
    }

    // Update last_movements for both users
    if (removed_by_id) {
      await supabaseAdmin
        .from('last_movements')
        .upsert({
          user_id: removed_by_id,
          item_id: item_id,
          last_movement: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_id'
        });
    }
    
    if (received_by_id) {
      await supabaseAdmin
        .from('last_movements')
        .upsert({
          user_id: received_by_id,
          item_id: item_id,
          last_movement: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_id'
        });
    }

    console.log('✅ Stock out transaction created:', transaction.transaction_id);
    return c.json({ transaction, new_stock: newStock });
  } catch (error) {
    console.error('❌ Exception creating stock out:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// Create transaction (return - devolução)
app.post("/make-server-264019ad/transactions/return", async (c) => {
  try {
    const { item_id, quantity, removed_by_id, received_by_id } = await c.req.json();

    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('in_stock')
      .eq('item_id', item_id)
      .single();

    if (itemError || !item) {
      return c.json({ error: 'Item not found' }, 404);
    }

    // Create transaction
    const { data: transaction, error: transError } = await supabaseAdmin
      .from('inventory_transactions')
      .insert({
        item_id,
        removed_by_id,
        received_by_id,
        transaction_type: 'return',
        quantity
      })
      .select()
      .single();

    if (transError) {
      console.error('❌ Error creating return:', transError);
      return c.json({ error: transError.message }, 400);
    }

    // Update stock
    const newStock = Number(item.in_stock) + Number(quantity);
    const { error: updateError } = await supabaseAdmin
      .from('items')
      .update({ in_stock: newStock })
      .eq('item_id', item_id);

    if (updateError) {
      console.error('❌ Error updating stock:', updateError);
      return c.json({ error: updateError.message }, 400);
    }

    // Update last_movements for both users
    if (removed_by_id) {
      await supabaseAdmin
        .from('last_movements')
        .upsert({
          user_id: removed_by_id,
          item_id: item_id,
          last_movement: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_id'
        });
    }
    
    if (received_by_id) {
      await supabaseAdmin
        .from('last_movements')
        .upsert({
          user_id: received_by_id,
          item_id: item_id,
          last_movement: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_id'
        });
    }

    console.log('✅ Return transaction created:', transaction.transaction_id);
    return c.json({ transaction, new_stock: newStock });
  } catch (error) {
    console.error('❌ Exception creating return:', error);
    return c.json({ error: 'Failed to create return' }, 500);
  }
});

// Create transaction (stock in - compra)
app.post("/make-server-264019ad/transactions/stock-in", async (c) => {
  try {
    const { item_id, quantity, employee_id } = await c.req.json();

    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('in_stock')
      .eq('item_id', item_id)
      .single();

    if (itemError || !item) {
      return c.json({ error: 'Item not found' }, 404);
    }

    // Create transaction
    const { data: transaction, error: transError } = await supabaseAdmin
      .from('inventory_transactions')
      .insert({
        item_id,
        received_by_id: employee_id,
        transaction_type: 'stock_in',
        quantity
      })
      .select()
      .single();

    if (transError) {
      console.error('❌ Error creating stock in:', transError);
      return c.json({ error: transError.message }, 400);
    }

    // Update stock
    const newStock = Number(item.in_stock) + Number(quantity);
    const { error: updateError } = await supabaseAdmin
      .from('items')
      .update({ in_stock: newStock })
      .eq('item_id', item_id);

    if (updateError) {
      console.error('❌ Error updating stock:', updateError);
      return c.json({ error: updateError.message }, 400);
    }

    // Update last_movements
    await supabaseAdmin
      .from('last_movements')
      .upsert({
        user_id: employee_id,
        item_id: item_id,
        last_movement: new Date().toISOString()
      }, {
        onConflict: 'user_id,item_id'
      });

    console.log('✅ Stock in transaction created:', transaction.transaction_id);
    return c.json({ transaction, new_stock: newStock });
  } catch (error) {
    console.error('❌ Exception creating stock in:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
});

// ==================== PHOTO UPLOAD ROUTE ====================

// Upload item photo to Supabase Storage (uses service role to bypass RLS)
app.post("/make-server-264019ad/items/upload-photo", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return c.json({ error: 'No photo provided' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawName = (formData.get('filename') as string | null)?.trim();
    const fileName = rawName ? `${rawName}.webp` : `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

    const { error } = await supabaseAdmin.storage
      .from('Produtos')
      .upload(fileName, arrayBuffer, { contentType: 'image/webp', upsert: false });

    if (error) {
      console.error('❌ Storage upload error:', error);
      return c.json({ error: error.message }, 400);
    }

    const { data } = supabaseAdmin.storage.from('Produtos').getPublicUrl(fileName);

    console.log('✅ Photo uploaded:', fileName);
    return c.json({ url: data.publicUrl });
  } catch (error) {
    console.error('❌ Exception uploading photo:', error);
    return c.json({ error: 'Failed to upload photo' }, 500);
  }
});

// ==================== BATCH TRANSACTION ROUTES ====================

// Batch stock out (entrega de múltiplos itens em 1 request)
app.post("/make-server-264019ad/transactions/batch/stock-out", async (c) => {
  try {
    const { items, removed_by_id, received_by_id } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required' }, 400);
    }

    const itemIds = items.map((i: any) => i.item_id);
    const now = new Date().toISOString();

    // Fetch all items at once
    const { data: stockItems, error: stockError } = await supabaseAdmin
      .from('items')
      .select('item_id, in_stock')
      .in('item_id', itemIds);

    if (stockError || !stockItems) {
      return c.json({ error: 'Failed to fetch items' }, 400);
    }

    // Validate stock for all items
    for (const { item_id, quantity } of items) {
      const stockItem = stockItems.find((s: any) => s.item_id === item_id);
      if (!stockItem) return c.json({ error: `Item ${item_id} not found` }, 404);
      if (stockItem.in_stock < quantity) {
        return c.json({ error: `Insufficient stock for item ${item_id}` }, 400);
      }
    }

    // Insert all transactions at once
    const { error: transError } = await supabaseAdmin
      .from('inventory_transactions')
      .insert(
        items.map(({ item_id, quantity }: any) => ({
          item_id,
          removed_by_id,
          received_by_id,
          transaction_type: 'stock_out',
          quantity,
        }))
      );

    if (transError) {
      console.error('❌ Error creating batch stock out:', transError);
      return c.json({ error: transError.message }, 400);
    }

    // Update stock for all items
    await Promise.all(
      items.map(({ item_id, quantity }: any) => {
        const stockItem = stockItems.find((s: any) => s.item_id === item_id);
        const newStock = Number(stockItem!.in_stock) - Number(quantity);
        return supabaseAdmin.from('items').update({ in_stock: newStock }).eq('item_id', item_id);
      })
    );

    // Upsert last_movements for both users (all items at once)
    const movementRows: any[] = [];
    for (const { item_id } of items) {
      if (removed_by_id) movementRows.push({ user_id: removed_by_id, item_id, last_movement: now });
      if (received_by_id) movementRows.push({ user_id: received_by_id, item_id, last_movement: now });
    }
    if (movementRows.length > 0) {
      await supabaseAdmin.from('last_movements').upsert(movementRows, { onConflict: 'user_id,item_id' });
    }

    console.log(`✅ Batch stock out: ${items.length} items`);
    return c.json({ success: true, count: items.length });
  } catch (error) {
    console.error('❌ Exception in batch stock out:', error);
    return c.json({ error: 'Failed to create batch stock out' }, 500);
  }
});

// Batch return (devolução de múltiplos itens em 1 request)
app.post("/make-server-264019ad/transactions/batch/return", async (c) => {
  try {
    const { items, removed_by_id, received_by_id } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required' }, 400);
    }

    const itemIds = items.map((i: any) => i.item_id);
    const now = new Date().toISOString();

    const { data: stockItems, error: stockError } = await supabaseAdmin
      .from('items')
      .select('item_id, in_stock')
      .in('item_id', itemIds);

    if (stockError || !stockItems) {
      return c.json({ error: 'Failed to fetch items' }, 400);
    }

    const { error: transError } = await supabaseAdmin
      .from('inventory_transactions')
      .insert(
        items.map(({ item_id, quantity }: any) => ({
          item_id,
          removed_by_id,
          received_by_id,
          transaction_type: 'return',
          quantity,
        }))
      );

    if (transError) {
      console.error('❌ Error creating batch return:', transError);
      return c.json({ error: transError.message }, 400);
    }

    await Promise.all(
      items.map(({ item_id, quantity }: any) => {
        const stockItem = stockItems.find((s: any) => s.item_id === item_id);
        const newStock = Number(stockItem!.in_stock) + Number(quantity);
        return supabaseAdmin.from('items').update({ in_stock: newStock }).eq('item_id', item_id);
      })
    );

    const movementRows: any[] = [];
    for (const { item_id } of items) {
      if (removed_by_id) movementRows.push({ user_id: removed_by_id, item_id, last_movement: now });
      if (received_by_id) movementRows.push({ user_id: received_by_id, item_id, last_movement: now });
    }
    if (movementRows.length > 0) {
      await supabaseAdmin.from('last_movements').upsert(movementRows, { onConflict: 'user_id,item_id' });
    }

    console.log(`✅ Batch return: ${items.length} items`);
    return c.json({ success: true, count: items.length });
  } catch (error) {
    console.error('❌ Exception in batch return:', error);
    return c.json({ error: 'Failed to create batch return' }, 500);
  }
});

// Batch stock in (compra de múltiplos itens em 1 request)
app.post("/make-server-264019ad/transactions/batch/stock-in", async (c) => {
  try {
    const { items, employee_id } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required' }, 400);
    }

    const itemIds = items.map((i: any) => i.item_id);
    const now = new Date().toISOString();

    const { data: stockItems, error: stockError } = await supabaseAdmin
      .from('items')
      .select('item_id, in_stock')
      .in('item_id', itemIds);

    if (stockError || !stockItems) {
      return c.json({ error: 'Failed to fetch items' }, 400);
    }

    const { error: transError } = await supabaseAdmin
      .from('inventory_transactions')
      .insert(
        items.map(({ item_id, quantity }: any) => ({
          item_id,
          received_by_id: employee_id,
          transaction_type: 'stock_in',
          quantity,
        }))
      );

    if (transError) {
      console.error('❌ Error creating batch stock in:', transError);
      return c.json({ error: transError.message }, 400);
    }

    await Promise.all(
      items.map(({ item_id, quantity }: any) => {
        const stockItem = stockItems.find((s: any) => s.item_id === item_id);
        const newStock = Number(stockItem!.in_stock) + Number(quantity);
        return supabaseAdmin.from('items').update({ in_stock: newStock }).eq('item_id', item_id);
      })
    );

    const movementRows = items.map(({ item_id }: any) => ({
      user_id: employee_id,
      item_id,
      last_movement: now,
    }));
    await supabaseAdmin.from('last_movements').upsert(movementRows, { onConflict: 'user_id,item_id' });

    console.log(`✅ Batch stock in: ${items.length} items`);
    return c.json({ success: true, count: items.length });
  } catch (error) {
    console.error('❌ Exception in batch stock in:', error);
    return c.json({ error: 'Failed to create batch stock in' }, 500);
  }
});

// ==================== PROFILE ROUTES ====================

// Get profile by employee_id
app.get("/make-server-264019ad/profile/:id", async (c) => {
  try {
    const id = c.req.param('id');
    
    const { data, error } = await supabaseAdmin
      .from('profile')
      .select('*')
      .eq('employee_id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching profile:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ profile: data });
  } catch (error) {
    console.error('❌ Exception fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Get all profiles
app.get("/make-server-264019ad/profiles", async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profile')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return c.json({ error: error.message }, 400);
    }

    // Filter only active profiles (where is_active is true or null for backwards compatibility)
    const activeProfiles = (data || []).filter(p => p.is_active !== false);

    return c.json({ profiles: activeProfiles });
  } catch (error) {
    console.error('❌ Exception fetching profiles:', error);
    return c.json({ error: 'Failed to fetch profiles' }, 500);
  }
});

// Get last movements for a specific employee (reads from last_movements table — O(items) not O(transactions))
app.get("/make-server-264019ad/profiles/:id/last-movements", async (c) => {
  try {
    const employeeId = c.req.param('id');

    const { data, error } = await supabaseAdmin
      .from('last_movements')
      .select('item_id, last_movement')
      .eq('user_id', employeeId);

    if (error) {
      console.error('❌ Error fetching last movements:', error);
      return c.json({ error: error.message }, 400);
    }

    const lastMovements: { [key: number]: string } = {};
    (data || []).forEach(({ item_id, last_movement }) => {
      lastMovements[item_id] = last_movement;
    });

    console.log('✅ Last movements found:', Object.keys(lastMovements).length);
    return c.json({ lastMovements });
  } catch (error) {
    console.error('❌ Exception fetching last movements:', error);
    return c.json({ error: 'Failed to fetch last movements' }, 500);
  }
});

// Create new profile
app.post("/make-server-264019ad/profiles", async (c) => {
  try {
    const body = await c.req.json();
    const { full_name, role } = body;

    console.log('📝 Recebendo requisição para criar profile:', { full_name, role });

    if (!full_name || !full_name.trim()) {
      console.log('❌ Nome vazio recebido');
      return c.json({ error: 'Nome é obrigatório' }, 400);
    }

    console.log('💾 Inserindo no banco:', { full_name: full_name.trim(), role: role || 'Cleaner' });

    const { data, error } = await supabaseAdmin
      .from('profile')
      .insert({
        full_name: full_name.trim(),
        role: role || 'Cleaner',
        is_active: true  // Set as active by default
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating profile:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ Profile created:', data.employee_id);
    return c.json({ profile: data }, 200);
  } catch (error) {
    console.error('❌ Exception creating profile:', error);
    return c.json({ error: 'Failed to create profile' }, 500);
  }
});

// Delete profile (soft delete - marks as inactive instead of deleting)
app.delete("/make-server-264019ad/profiles/:id", async (c) => {
  try {
    const id = c.req.param('id');

    console.log('🗑️ Marcando profile como inativo:', id);

    // Soft delete: just mark as inactive instead of deleting
    const { error } = await supabaseAdmin
      .from('profile')
      .update({ is_active: false })
      .eq('employee_id', id);

    if (error) {
      console.error('❌ Error marking profile as inactive:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ Profile marked as inactive:', id);
    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Exception marking profile as inactive:', error);
    return c.json({ error: 'Failed to remove profile' }, 500);
  }
});

Deno.serve(app.fetch);