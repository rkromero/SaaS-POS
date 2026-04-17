-- Promotions module: promotional prices, discounts, and product combos

CREATE TYPE promotion_type AS ENUM ('product_price', 'discount', 'combo');
CREATE TYPE promotion_discount_type AS ENUM ('percent', 'fixed');
CREATE TYPE promotion_discount_scope AS ENUM ('product', 'category', 'total');

CREATE TABLE IF NOT EXISTS promotion (
  id serial PRIMARY KEY,
  organization_id text NOT NULL,
  name text NOT NULL,
  description text,
  type promotion_type NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  is_stackable boolean DEFAULT false NOT NULL,
  starts_at timestamp,
  ends_at timestamp,
  target_product_id integer REFERENCES product(id) ON DELETE CASCADE,
  promo_price numeric(10, 2),
  discount_type promotion_discount_type,
  discount_value numeric(10, 2),
  discount_scope promotion_discount_scope,
  target_category_id integer REFERENCES category(id) ON DELETE SET NULL,
  combo_price numeric(10, 2),
  updated_at timestamp DEFAULT now() NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX promotion_org_idx ON promotion(organization_id);
CREATE INDEX promotion_org_active_idx ON promotion(organization_id, is_active);

CREATE TABLE IF NOT EXISTS promotion_combo_item (
  id serial PRIMARY KEY,
  promotion_id integer NOT NULL REFERENCES promotion(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX combo_item_promotion_idx ON promotion_combo_item(promotion_id);

-- Link sale_item to a promotion/combo for reporting
ALTER TABLE sale_item
  ADD COLUMN IF NOT EXISTS promotion_id integer REFERENCES promotion(id) ON DELETE SET NULL;
