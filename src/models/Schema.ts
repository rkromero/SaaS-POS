import {
  bigint,
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Existing tables (do not modify)
// ---------------------------------------------------------------------------

export const planTypeEnum = pgEnum('plan_type', [
  'free',
  'socio',
  'basic',
  'pro',
  'enterprise',
]);

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    // Mercado Pago subscription fields
    planType: planTypeEnum('plan_type').default('free').notNull(),
    mpPreapprovalId: text('mp_preapproval_id'),
    mpPlanStatus: text('mp_plan_status'), // authorized | paused | cancelled | pending
    planExpiresAt: timestamp('plan_expires_at', { mode: 'date' }),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
    };
  },
);

export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// POS Module — Enums
// ---------------------------------------------------------------------------

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'in',
  'out',
]);

export const stockMovementReasonEnum = pgEnum('stock_movement_reason', [
  'purchase', // compra
  'adjustment', // ajuste manual
  'return', // devolución
  'loss', // pérdida
  'breakage', // rotura
  'sale', // descuento automático por venta
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash', // efectivo
  'debit', // tarjeta de débito
  'credit', // tarjeta de crédito
  'transfer', // transferencia
]);

export const saleStatusEnum = pgEnum('sale_status', [
  'completed',
  'cancelled',
]);

// ---------------------------------------------------------------------------
// POS Module — Tables
// ---------------------------------------------------------------------------

// Locations (sucursales/locales) — belong to a Clerk organization
export const locationSchema = pgTable('location', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// User ↔ Location assignment (each user belongs to one location)
export const userLocationSchema = pgTable('user_location', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  locationId: integer('location_id')
    .notNull()
    .references(() => locationSchema.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Product categories — scoped to organization
export const categorySchema = pgTable('category', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Products — global per organization, admin manages them
export const productSchema = pgTable('product', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  categoryId: integer('category_id').references(() => categorySchema.id, {
    onDelete: 'set null',
  }),
  // supplierId is set after supplierSchema is declared (see bottom of file)
  supplierId: integer('supplier_id'),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
  sku: text('sku'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Product overrides per location (price and active status)
export const productLocationSchema = pgTable(
  'product_location',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => productSchema.id, { onDelete: 'cascade' }),
    locationId: integer('location_id')
      .notNull()
      .references(() => locationSchema.id, { onDelete: 'cascade' }),
    // null = use global product price
    price: numeric('price', { precision: 10, scale: 2 }),
    isActive: boolean('is_active').default(true).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    productLocationIdx: uniqueIndex('product_location_idx').on(
      table.productId,
      table.locationId,
    ),
  }),
);

// Stock — current quantity per product per location
export const stockSchema = pgTable(
  'stock',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => productSchema.id, { onDelete: 'cascade' }),
    locationId: integer('location_id')
      .notNull()
      .references(() => locationSchema.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').default(0).notNull(),
    // Alert threshold: show warning when quantity falls below this value
    lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  table => ({
    stockProductLocationIdx: uniqueIndex('stock_product_location_idx').on(
      table.productId,
      table.locationId,
    ),
  }),
);

// Stock movements — full audit trail of every stock change
export const stockMovementSchema = pgTable('stock_movement', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stockSchema.id, { onDelete: 'cascade' }),
  type: stockMovementTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(),
  reason: stockMovementReasonEnum('reason').notNull(),
  userId: text('user_id').notNull(), // Clerk user ID
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Customers — registered at point of sale
export const customerSchema = pgTable('customer', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  whatsapp: text('whatsapp'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Sales — one record per completed transaction
export const saleSchema = pgTable('sale', {
  id: serial('id').primaryKey(),
  // Correlative receipt number per organization (e.g. "ORG-000001")
  receiptNumber: text('receipt_number').notNull(),
  organizationId: text('organization_id').notNull(),
  locationId: integer('location_id')
    .notNull()
    .references(() => locationSchema.id),
  userId: text('user_id').notNull(), // Clerk user ID (cashier)
  customerId: integer('customer_id').references(() => customerSchema.id, {
    onDelete: 'set null',
  }),
  // Customer data stored directly to preserve history even if customer is deleted
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerWhatsapp: text('customer_whatsapp'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: saleStatusEnum('status').default('completed').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Sale items — products included in each sale
export const saleItemSchema = pgTable('sale_item', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id')
    .notNull()
    .references(() => saleSchema.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => productSchema.id, {
    onDelete: 'set null',
  }),
  // Product name and price stored at time of sale to preserve history
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Fiado — Customer debt / cuenta corriente
// ---------------------------------------------------------------------------

export const debtTransactionTypeEnum = pgEnum('debt_transaction_type', [
  'charge', // se fió (se agregó deuda)
  'payment', // pagó (se redujo deuda)
]);

// Each row = one charge or one payment on a customer account
export const debtTransactionSchema = pgTable('debt_transaction', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  locationId: integer('location_id')
    .notNull()
    .references(() => locationSchema.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customerSchema.id, { onDelete: 'cascade' }),
  // Denormalized for history integrity
  customerName: text('customer_name').notNull(),
  type: debtTransactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'), // e.g. "Alfajor + coca", "Pago en efectivo"
  // Optional link to the sale that originated the charge
  saleId: integer('sale_id').references(() => saleSchema.id, {
    onDelete: 'set null',
  }),
  userId: text('user_id').notNull(), // Clerk user ID (cashier who registered it)
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Cash register sessions — apertura y cierre de caja
// ---------------------------------------------------------------------------

export const cashRegisterStatusEnum = pgEnum('cash_register_status', [
  'open',
  'closed',
]);

export const cashRegisterSessionSchema = pgTable('cash_register_session', {
  id: serial('id').primaryKey(),
  locationId: integer('location_id')
    .notNull()
    .references(() => locationSchema.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // who opened the session
  closedByUserId: text('closed_by_user_id'),
  openingBalance: numeric('opening_balance', {
    precision: 10,
    scale: 2,
  }).notNull(), // fondo inicial
  closingBalance: numeric('closing_balance', { precision: 10, scale: 2 }), // efectivo contado al cerrar
  totalSales: numeric('total_sales', { precision: 10, scale: 2 }), // calculado al cerrar
  totalCash: numeric('total_cash', { precision: 10, scale: 2 }), // ventas en efectivo
  totalTransfer: numeric('total_transfer', { precision: 10, scale: 2 }),
  totalCard: numeric('total_card', { precision: 10, scale: 2 }),
  difference: numeric('difference', { precision: 10, scale: 2 }), // closingBalance - (openingBalance + totalCash)
  notes: text('notes'),
  status: cashRegisterStatusEnum('status').default('open').notNull(),
  openedAt: timestamp('opened_at', { mode: 'date' }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { mode: 'date' }),
});

// ---------------------------------------------------------------------------
// Suppliers — proveedores
// ---------------------------------------------------------------------------

export const supplierSchema = pgTable('supplier', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Purchase orders — órdenes de compra a proveedores
// ---------------------------------------------------------------------------

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'pending', // generado, aún no llegó
  'received', // mercadería recibida (actualiza stock)
  'cancelled',
]);

export const purchaseOrderSchema = pgTable('purchase_order', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  locationId: integer('location_id')
    .notNull()
    .references(() => locationSchema.id, { onDelete: 'cascade' }),
  supplierId: integer('supplier_id').references(() => supplierSchema.id, {
    onDelete: 'set null',
  }),
  supplierName: text('supplier_name').notNull(), // denormalized
  status: purchaseOrderStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  userId: text('user_id').notNull(), // who created it
  receivedByUserId: text('received_by_user_id'),
  receivedAt: timestamp('received_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const purchaseOrderItemSchema = pgTable('purchase_order_item', {
  id: serial('id').primaryKey(),
  purchaseOrderId: integer('purchase_order_id')
    .notNull()
    .references(() => purchaseOrderSchema.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => productSchema.id, {
    onDelete: 'set null',
  }),
  productName: text('product_name').notNull(), // denormalized
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
