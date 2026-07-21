import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

type AuthedProfile = {
  employee_id: number;
  org_id: string;
  role: string;
  full_name: string;
  is_active: boolean;
};

type Variables = {
  profile: AuthedProfile;
  authUserId: string;
};

const app = new Hono<{ Variables: Variables }>();

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

// ==================== TENANT HELPERS ====================

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'org';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Paths that don't require an authenticated + org-linked caller.
const PUBLIC_PATHS = new Set([
  '/make-server-264019ad/health',
  '/make-server-264019ad/jobs.xml',
  '/make-server-264019ad/auth/signup-org',
  '/make-server-264019ad/auth/signup-join',
]);

// Verifies the caller's real session (not the shared anon key) and resolves
// their org/role server-side — every route below trusts c.get('profile'),
// never a client-supplied org_id.
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS' || PUBLIC_PATHS.has(c.req.path)) {
    return next();
  }

  const token = (c.req.header('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return c.json({ error: 'Missing authorization' }, 401);
  }

  const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !userData?.user) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profile')
    .select('employee_id, org_id, role, full_name, is_active')
    .eq('auth_user_id', userData.user.id)
    .single();

  if (profErr || !profile) {
    return c.json({ error: 'No profile linked to this account' }, 403);
  }
  if (profile.is_active === false) {
    return c.json({ error: 'Account disabled' }, 403);
  }

  c.set('authUserId', userData.user.id);
  c.set('profile', profile as AuthedProfile);
  await next();
});

function requireRole(...roles: string[]) {
  return async (c: any, next: any) => {
    const profile = c.get('profile') as AuthedProfile;
    if (!roles.includes(profile.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
}

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

// Sign up and create a brand-new organization (caller becomes its Owner)
app.post("/make-server-264019ad/auth/signup-org", async (c) => {
  let createdUserId: string | undefined;
  let createdOrgId: string | undefined;
  try {
    const { email, password, name, orgName } = await c.req.json();

    if (!orgName || !orgName.trim()) {
      return c.json({ error: 'Nome da organização é obrigatório' }, 400);
    }

    console.log('📝 Creating org owner:', email);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { name, email },
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      if (authError.message.includes('already been registered') || authError.status === 422) {
        return c.json({ error: 'Este email já está cadastrado no sistema' }, 400);
      }
      return c.json({ error: authError.message }, 400);
    }
    createdUserId = authData.user.id;

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({ name: orgName.trim(), slug: slugify(orgName), invite_code: generateInviteCode() })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Org creation error:', orgError);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      return c.json({ error: orgError.message }, 400);
    }
    createdOrgId = org.org_id;

    const { error: profileError } = await supabaseAdmin
      .from('profile')
      .insert({
        full_name: name,
        role: 'Owner',
        org_id: org.org_id,
        auth_user_id: createdUserId,
        is_active: true,
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      await supabaseAdmin.from('organizations').delete().eq('org_id', createdOrgId);
      return c.json({ error: profileError.message }, 400);
    }

    console.log('✅ Organization + owner created:', org.org_id);
    return c.json({
      success: true,
      user: { id: createdUserId, email: authData.user.email, name, role: 'Owner' },
      organization: { org_id: org.org_id, name: org.name, slug: org.slug, invite_code: org.invite_code },
    });
  } catch (error) {
    console.error('❌ Signup-org exception:', error);
    // Best-effort cleanup so a failed signup never leaves an orphaned auth user/org behind
    if (createdUserId) await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => {});
    if (createdOrgId) await supabaseAdmin.from('organizations').delete().eq('org_id', createdOrgId).catch(() => {});
    return c.json({ error: 'Failed to create organization' }, 500);
  }
});

// Sign up and join an existing organization via its invite code
app.post("/make-server-264019ad/auth/signup-join", async (c) => {
  let createdUserId: string | undefined;
  try {
    const { email, password, name, inviteCode, role } = await c.req.json();

    if (!inviteCode || !inviteCode.trim()) {
      return c.json({ error: 'Código de convite é obrigatório' }, 400);
    }

    const { data: org, error: orgLookupError } = await supabaseAdmin
      .from('organizations')
      .select('org_id, name')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (orgLookupError || !org) {
      return c.json({ error: 'Código de convite inválido' }, 400);
    }

    console.log('📝 Creating user joining org:', email, org.org_id);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, email },
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      if (authError.message.includes('already been registered') || authError.status === 422) {
        return c.json({ error: 'Este email já está cadastrado no sistema' }, 400);
      }
      return c.json({ error: authError.message }, 400);
    }
    createdUserId = authData.user.id;

    const finalRole = role || 'Cleaner';
    const { error: profileError } = await supabaseAdmin
      .from('profile')
      .insert({
        full_name: name,
        role: finalRole,
        org_id: org.org_id,
        auth_user_id: createdUserId,
        is_active: true,
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      return c.json({ error: profileError.message }, 400);
    }

    console.log('✅ User joined organization:', org.org_id);
    return c.json({
      success: true,
      user: { id: createdUserId, email: authData.user.email, name, role: finalRole },
      organization: { org_id: org.org_id, name: org.name },
    });
  } catch (error) {
    console.error('❌ Signup-join exception:', error);
    if (createdUserId) await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => {});
    return c.json({ error: 'Failed to join organization' }, 500);
  }
});

// Current caller's profile + organization — replaces client-side name-matching
app.get("/make-server-264019ad/me", async (c) => {
  try {
    const profile = c.get('profile');
    const canSeeInviteCode = profile.role === 'Admin' || profile.role === 'Owner';

    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .select(canSeeInviteCode ? 'org_id, name, slug, invite_code' : 'org_id, name, slug')
      .eq('org_id', profile.org_id)
      .single();

    if (error || !org) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    return c.json({ profile, organization: org });
  } catch (error) {
    console.error('❌ Exception fetching /me:', error);
    return c.json({ error: 'Failed to fetch current user' }, 500);
  }
});

// ==================== ITEMS ROUTES ====================

// Get all items
app.get("/make-server-264019ad/items", async (c) => {
  try {
    const { org_id } = c.get('profile');
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('org_id', org_id)
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
    const { org_id } = c.get('profile');
    const id = c.req.param('id');

    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('item_id', id)
      .eq('org_id', org_id)
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
app.post("/make-server-264019ad/items", requireRole('Admin', 'Owner'), async (c) => {
  try {
    const { org_id } = c.get('profile');
    const itemData = await c.req.json();
    delete itemData.org_id;

    const { data, error } = await supabaseAdmin
      .from('items')
      .insert({ ...itemData, org_id })
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
app.put("/make-server-264019ad/items/:id", requireRole('Admin', 'Owner'), async (c) => {
  try {
    const { org_id } = c.get('profile');
    const id = c.req.param('id');
    const updates = await c.req.json();
    delete updates.org_id;

    const { data, error } = await supabaseAdmin
      .from('items')
      .update(updates)
      .eq('item_id', id)
      .eq('org_id', org_id)
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
app.delete("/make-server-264019ad/items/:id", requireRole('Admin', 'Owner'), async (c) => {
  try {
    const { org_id } = c.get('profile');
    const id = c.req.param('id');

    const { error } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('item_id', id)
      .eq('org_id', org_id);

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
    const { org_id } = c.get('profile');
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
      q = q.eq('org_id', org_id);
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
    const { org_id } = c.get('profile');
    const { item_id, quantity, removed_by_id, received_by_id } = await c.req.json();

    // Get current stock (scoped to this org — a cross-tenant item_id guess 404s instead of leaking)
    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('in_stock')
      .eq('item_id', item_id)
      .eq('org_id', org_id)
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
        quantity,
        org_id,
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
      .eq('item_id', item_id)
      .eq('org_id', org_id);

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
          last_movement: new Date().toISOString(),
          org_id,
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
          last_movement: new Date().toISOString(),
          org_id,
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
    const { org_id } = c.get('profile');
    const { item_id, quantity, removed_by_id, received_by_id } = await c.req.json();

    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('in_stock')
      .eq('item_id', item_id)
      .eq('org_id', org_id)
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
        quantity,
        org_id,
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
      .eq('item_id', item_id)
      .eq('org_id', org_id);

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
          last_movement: new Date().toISOString(),
          org_id,
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
          last_movement: new Date().toISOString(),
          org_id,
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
    const { org_id } = c.get('profile');
    const { item_id, quantity, employee_id } = await c.req.json();

    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('in_stock')
      .eq('item_id', item_id)
      .eq('org_id', org_id)
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
        quantity,
        org_id,
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
      .eq('item_id', item_id)
      .eq('org_id', org_id);

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
        last_movement: new Date().toISOString(),
        org_id,
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
    const { org_id } = c.get('profile');
    const formData = await c.req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return c.json({ error: 'No photo provided' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawName = (formData.get('filename') as string | null)?.trim();
    const baseName = rawName || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fileName = `${org_id}/${baseName}.webp`;

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
    const { org_id } = c.get('profile');
    const { items, removed_by_id, received_by_id } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required' }, 400);
    }

    const itemIds = items.map((i: any) => i.item_id);
    const now = new Date().toISOString();

    // Fetch all items at once, scoped to this org
    const { data: stockItems, error: stockError } = await supabaseAdmin
      .from('items')
      .select('item_id, in_stock')
      .eq('org_id', org_id)
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
          org_id,
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
        return supabaseAdmin.from('items').update({ in_stock: newStock }).eq('item_id', item_id).eq('org_id', org_id);
      })
    );

    // Upsert last_movements for both users (all items at once)
    const movementRows: any[] = [];
    for (const { item_id } of items) {
      if (removed_by_id) movementRows.push({ user_id: removed_by_id, item_id, last_movement: now, org_id });
      if (received_by_id) movementRows.push({ user_id: received_by_id, item_id, last_movement: now, org_id });
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
    const { org_id } = c.get('profile');
    const { items, removed_by_id, received_by_id } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required' }, 400);
    }

    const itemIds = items.map((i: any) => i.item_id);
    const now = new Date().toISOString();

    const { data: stockItems, error: stockError } = await supabaseAdmin
      .from('items')
      .select('item_id, in_stock')
      .eq('org_id', org_id)
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
          org_id,
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
        return supabaseAdmin.from('items').update({ in_stock: newStock }).eq('item_id', item_id).eq('org_id', org_id);
      })
    );

    const movementRows: any[] = [];
    for (const { item_id } of items) {
      if (removed_by_id) movementRows.push({ user_id: removed_by_id, item_id, last_movement: now, org_id });
      if (received_by_id) movementRows.push({ user_id: received_by_id, item_id, last_movement: now, org_id });
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
    const { org_id } = c.get('profile');
    const { items, employee_id } = await c.req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Items array is required' }, 400);
    }

    const itemIds = items.map((i: any) => i.item_id);
    const now = new Date().toISOString();

    const { data: stockItems, error: stockError } = await supabaseAdmin
      .from('items')
      .select('item_id, in_stock')
      .eq('org_id', org_id)
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
          org_id,
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
        return supabaseAdmin.from('items').update({ in_stock: newStock }).eq('item_id', item_id).eq('org_id', org_id);
      })
    );

    const movementRows = items.map(({ item_id }: any) => ({
      user_id: employee_id,
      item_id,
      last_movement: now,
      org_id,
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
    const { org_id } = c.get('profile');
    const id = c.req.param('id');

    const { data, error } = await supabaseAdmin
      .from('profile')
      .select('*')
      .eq('employee_id', id)
      .eq('org_id', org_id)
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
    const { org_id } = c.get('profile');
    const { data, error } = await supabaseAdmin
      .from('profile')
      .select('*')
      .eq('org_id', org_id)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return c.json({ error: error.message }, 400);
    }

    // Filter only active profiles (where is_active is true or null for backwards compatibility)
    const activeProfiles = (data || []).filter(p => p.is_active !== false);

    // Only Supervisoras (and above) have a real login to activate — Cleaners
    // never appear in this RPC's result since they have no auth_user_id.
    // pending = invited but hasn't finished setting a password yet (a link
    // click alone, e.g. from an email security scanner, doesn't count).
    const { data: authStatus } = await supabaseAdmin.rpc('profile_auth_status', { org_id_param: org_id });
    const hasPasswordByEmployeeId = new Map((authStatus || []).map((r: any) => [r.employee_id, r.has_password]));
    const profilesWithStatus = activeProfiles.map(p => ({
      ...p,
      pending: hasPasswordByEmployeeId.has(p.employee_id) ? !hasPasswordByEmployeeId.get(p.employee_id) : undefined,
    }));

    return c.json({ profiles: profilesWithStatus });
  } catch (error) {
    console.error('❌ Exception fetching profiles:', error);
    return c.json({ error: 'Failed to fetch profiles' }, 500);
  }
});

// Get last movements for a specific employee (reads from last_movements table — O(items) not O(transactions))
app.get("/make-server-264019ad/profiles/:id/last-movements", async (c) => {
  try {
    const { org_id } = c.get('profile');
    const employeeId = c.req.param('id');

    const { data, error } = await supabaseAdmin
      .from('last_movements')
      .select('item_id, last_movement')
      .eq('user_id', employeeId)
      .eq('org_id', org_id);

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

// Create new Cleaner profile (no-login employee, used for shared-device
// transaction attribution). Deliberately always creates role='Cleaner'
// regardless of any role sent in the body -- this is the only endpoint that
// creates login-less profiles, so it must never be usable to mint an
// Admin/Owner/Supervisora profile. Real accounts only come from signup.
app.post("/make-server-264019ad/profiles", requireRole('Admin', 'Owner', 'Supervisora'), async (c) => {
  try {
    const { org_id } = c.get('profile');
    const body = await c.req.json();
    const { full_name } = body;

    console.log('📝 Recebendo requisição para criar cleaner:', { full_name });

    if (!full_name || !full_name.trim()) {
      console.log('❌ Nome vazio recebido');
      return c.json({ error: 'Nome é obrigatório' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('profile')
      .insert({
        full_name: full_name.trim(),
        role: 'Cleaner',
        org_id,
        is_active: true,  // Set as active by default
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

// Delete profile (soft delete - marks as inactive instead of deleting).
// Supervisora may only remove Cleaners; removing anyone else (another
// Supervisora, Admin, or Owner) requires Admin/Owner, checked against the
// *target's* actual role, not just the caller's.
app.delete("/make-server-264019ad/profiles/:id", requireRole('Admin', 'Owner', 'Supervisora'), async (c) => {
  try {
    const { org_id, role: callerRole } = c.get('profile');
    const id = c.req.param('id');

    const { data: target, error: targetError } = await supabaseAdmin
      .from('profile')
      .select('role')
      .eq('employee_id', id)
      .eq('org_id', org_id)
      .single();

    if (targetError || !target) {
      return c.json({ error: 'Funcionário não encontrado' }, 404);
    }

    if (target.role !== 'Cleaner' && callerRole === 'Supervisora') {
      return c.json({ error: 'Você não tem permissão para remover este usuário' }, 403);
    }

    console.log('🗑️ Marcando profile como inativo:', id);

    // Soft delete: just mark as inactive instead of deleting
    const { error } = await supabaseAdmin
      .from('profile')
      .update({ is_active: false })
      .eq('employee_id', id)
      .eq('org_id', org_id);

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

// ==================== INVITE ROUTES ====================

// Invite a Supervisora by email. Uses Supabase Auth's built-in invite flow:
// creates the auth user (unconfirmed) and sends the "Invite user" email
// with a link back to redirectTo. The profile row is created immediately
// so the org sees the invite right away (Supervisoras table), linked via
// auth_user_id -- the invitee just needs to follow the email link and set
// a password to be able to sign in.
app.post("/make-server-264019ad/invites", requireRole('Admin', 'Owner'), async (c) => {
  let createdUserId: string | undefined;
  try {
    const { org_id, employee_id: invitedByEmployeeId } = c.get('profile');
    const { email, name, redirectTo } = await c.req.json();

    if (!email || !email.trim()) {
      return c.json({ error: 'Email é obrigatório' }, 400);
    }
    if (!name || !name.trim()) {
      return c.json({ error: 'Nome é obrigatório' }, 400);
    }
    if (!redirectTo) {
      return c.json({ error: 'redirectTo é obrigatório' }, 400);
    }

    console.log('📧 Convidando supervisora:', email);

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim(),
      {
        data: { name: name.trim(), org_id, role: 'Supervisora' },
        redirectTo,
      }
    );

    if (inviteError) {
      console.error('❌ Invite error:', inviteError);
      if (inviteError.message.includes('already been registered') || (inviteError as any).status === 422) {
        return c.json({ error: 'Este email já está cadastrado no sistema' }, 400);
      }
      return c.json({ error: inviteError.message }, 400);
    }
    createdUserId = inviteData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profile')
      .insert({
        full_name: name.trim(),
        role: 'Supervisora',
        org_id,
        auth_user_id: createdUserId,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      return c.json({ error: profileError.message }, 400);
    }

    console.log('✅ Supervisora invited:', profile.employee_id, 'by employee', invitedByEmployeeId);
    return c.json({ success: true, profile });
  } catch (error) {
    console.error('❌ Exception inviting supervisor:', error);
    if (createdUserId) await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => {});
    return c.json({ error: 'Failed to invite supervisor' }, 500);
  }
});

Deno.serve(app.fetch);
