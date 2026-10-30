-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - SUPABASE POSTGRESQL MIGRATION
-- File: 02_triggers_and_functions.sql
-- Description: Business Logic Stored Procedures, Stock Ledger Triggers, ACID Functions
-- Target Platform: Supabase / PostgreSQL 15+
-- =====================================================================

-- =====================================================================
-- 1. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'company_settings',
    'user_profiles',
    'suppliers',
    'products',
    'customers',
    'purchase_orders',
    'sales',
    'quotations',
    'installation_projects'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
      CREATE TRIGGER trg_set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;

-- =====================================================================
-- 2. ATOMIC SALE TRANSACTION FUNCTION
-- Performs concurrency validation, inventory balance checks, stock deduction,
-- movement ledger insertion, customer balance update, and sales record creation.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_execute_sale(
  p_customer_id UUID,
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_tier pricing_tier,
  p_items JSONB, -- Array of {productId, quantity, unitPrice, discount}
  p_payment_method payment_method,
  p_paid_amount NUMERIC,
  p_split_details JSONB,
  p_warehouse_location VARCHAR,
  p_sales_rep_id UUID,
  p_sales_rep_name VARCHAR,
  p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_prod RECORD;
  v_subtotal NUMERIC := 0;
  v_discount_total NUMERIC := 0;
  v_cogs NUMERIC := 0;
  v_grand_total NUMERIC := 0;
  v_balance_due NUMERIC := 0;
  v_gross_profit NUMERIC := 0;
  v_sale_id UUID;
  v_invoice_number VARCHAR;
  v_seq INT;
  v_populated_items JSONB := '[]'::jsonb;
  v_prev_stock INT;
  v_new_stock INT;
  v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
  -- 1. Generate sequential unique invoice number
  SELECT count(*) + 1001 INTO v_seq FROM sales;
  v_invoice_number := 'OFF-INV-' || to_char(v_now, 'YYYY') || '-' || v_seq::text;

  -- 2. Verify stock availability and lock product rows (FOR UPDATE)
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    productId UUID,
    quantity INT,
    unitPrice NUMERIC,
    discount NUMERIC
  ) LOOP
    SELECT * INTO v_prod FROM products WHERE id = v_item.productId FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % does not exist in catalog', v_item.productId;
    END IF;

    IF v_prod.current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        v_prod.name, v_prod.current_stock, v_item.quantity;
    END IF;

    -- Financial computations
    v_subtotal := v_subtotal + (v_item.unitPrice * v_item.quantity);
    v_discount_total := v_discount_total + COALESCE(v_item.discount, 0);
    v_cogs := v_cogs + (v_prod.purchase_cost * v_item.quantity);

    v_populated_items := v_populated_items || jsonb_build_object(
      'productId', v_prod.id,
      'productName', v_prod.name,
      'sku', v_prod.sku,
      'unit', v_prod.unit,
      'unitPrice', v_item.unitPrice,
      'unitCost', v_prod.purchase_cost,
      'quantity', v_item.quantity,
      'discount', COALESCE(v_item.discount, 0),
      'subtotal', (v_item.unitPrice * v_item.quantity) - COALESCE(v_item.discount, 0)
    );
  END LOOP;

  v_grand_total := GREATEST(0, v_subtotal - v_discount_total);
  v_balance_due := GREATEST(0, v_grand_total - p_paid_amount);
  v_gross_profit := v_grand_total - v_cogs;

  -- 3. Insert sales record
  INSERT INTO sales (
    invoice_number,
    customer_id,
    customer_name,
    customer_phone,
    customer_tier,
    items,
    subtotal,
    discount_total,
    tax_amount,
    grand_total,
    paid_amount,
    balance_due,
    cost_of_goods_sold,
    gross_profit,
    payment_method,
    payment_status,
    sales_rep_id,
    sales_rep_name,
    warehouse_location,
    notes,
    created_at
  ) VALUES (
    v_invoice_number,
    p_customer_id,
    p_customer_name,
    p_customer_phone,
    p_customer_tier,
    v_populated_items,
    v_subtotal,
    v_discount_total,
    0.00,
    v_grand_total,
    p_paid_amount,
    v_balance_due,
    v_cogs,
    v_gross_profit,
    p_payment_method,
    CASE WHEN v_balance_due = 0 THEN 'paid'::payment_status WHEN p_paid_amount > 0 THEN 'partial'::payment_status ELSE 'unpaid'::payment_status END,
    p_sales_rep_id,
    p_sales_rep_name,
    p_warehouse_location,
    p_notes,
    v_now
  ) RETURNING id INTO v_sale_id;

  -- 4. Insert Payment record if paid amount > 0
  IF p_paid_amount > 0 THEN
    INSERT INTO payments (
      sale_id,
      amount,
      method,
      reference,
      recorded_by,
      split_details,
      paid_at
    ) VALUES (
      v_sale_id,
      p_paid_amount,
      p_payment_method,
      upper(p_payment_method::text) || '-' || substr(v_sale_id::text, 1, 8),
      p_sales_rep_name,
      p_split_details,
      v_now
    );
  END IF;

  -- 5. Deduct inventory and record stock movement ledger entries
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    productId UUID,
    quantity INT,
    unitPrice NUMERIC,
    discount NUMERIC
  ) LOOP
    SELECT * INTO v_prod FROM products WHERE id = v_item.productId;
    v_prev_stock := v_prod.current_stock;
    v_new_stock := v_prev_stock - v_item.quantity;

    UPDATE products
    SET current_stock = v_new_stock
    WHERE id = v_item.productId;

    INSERT INTO stock_movements (
      product_id,
      product_name,
      sku,
      type,
      quantity,
      previous_stock,
      new_stock,
      unit_cost,
      total_cost,
      reference_id,
      warehouse_location,
      reason,
      performed_by_user_id,
      performed_by_user_name,
      created_at
    ) VALUES (
      v_prod.id,
      v_prod.name,
      v_prod.sku,
      'sale'::stock_movement_type,
      -v_item.quantity,
      v_prev_stock,
      v_new_stock,
      v_prod.purchase_cost,
      v_item.quantity * v_prod.purchase_cost,
      v_invoice_number,
      p_warehouse_location,
      'POS sale to ' || p_customer_name,
      p_sales_rep_id,
      p_sales_rep_name,
      v_now
    );

    -- Low stock trigger notification
    IF v_new_stock <= v_prod.reorder_level THEN
      INSERT INTO app_notifications (
        title,
        message,
        type,
        link_module,
        created_at
      ) VALUES (
        CASE WHEN v_new_stock = 0 THEN 'Out of Stock Alert' ELSE 'Low Stock Warning' END,
        v_prod.name || ' has reached ' || v_new_stock || ' units in stock.',
        CASE WHEN v_new_stock = 0 THEN 'alert' ELSE 'warning' END,
        'inventory',
        v_now
      );
    END IF;
  END LOOP;

  -- 6. Update Customer Ledger
  IF p_customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_purchases = total_purchases + v_grand_total,
        outstanding_balance = outstanding_balance + v_balance_due,
        last_purchase_date = v_now
    WHERE id = p_customer_id;
  END IF;

  -- 7. Audit Log
  INSERT INTO audit_logs (
    user_id,
    user_name,
    user_role,
    action,
    module,
    record_id,
    details,
    timestamp
  ) VALUES (
    p_sales_rep_id,
    p_sales_rep_name,
    'sales_rep'::user_role,
    'SALE_COMPLETED',
    'sales',
    v_invoice_number,
    'Completed sale #' || v_invoice_number || ' for ₦' || to_char(v_grand_total, 'FM999,999,999.00'),
    v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'saleId', v_sale_id,
    'invoiceNumber', v_invoice_number,
    'grandTotal', v_grand_total,
    'paidAmount', p_paid_amount,
    'balanceDue', v_balance_due
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 3. GOODS RECEIVED (GRN) ATOMIC FUNCTION
-- Increases inventory ONLY on confirmed physical receipt and creates ledger entry.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_receive_goods(
  p_po_id UUID,
  p_received_items JSONB, -- Array of {productId, receivedQty}
  p_warehouse_location VARCHAR,
  p_user_id UUID,
  p_user_name VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_po RECORD;
  v_item RECORD;
  v_prod RECORD;
  v_prev_stock INT;
  v_new_stock INT;
  v_now TIMESTAMPTZ := timezone('utc', now());
  v_all_received BOOLEAN := TRUE;
  v_updated_items JSONB := '[]'::jsonb;
  v_po_item JSONB;
  v_rec_qty INT;
  v_ord_qty INT;
  v_already_rec INT;
BEGIN
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order % not found', p_po_id;
  END IF;

  -- Process each received item
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_received_items) AS x(
    productId UUID,
    receivedQty INT
  ) LOOP
    IF v_item.receivedQty <= 0 THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_prod FROM products WHERE id = v_item.productId FOR UPDATE;
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_prev_stock := v_prod.current_stock;
    v_new_stock := v_prev_stock + v_item.receivedQty;

    -- Increase product stock balance
    UPDATE products
    SET current_stock = v_new_stock
    WHERE id = v_item.productId;

    -- Record in stock movement ledger
    INSERT INTO stock_movements (
      product_id,
      product_name,
      sku,
      type,
      quantity,
      previous_stock,
      new_stock,
      unit_cost,
      total_cost,
      reference_id,
      warehouse_location,
      reason,
      performed_by_user_id,
      performed_by_user_name,
      created_at
    ) VALUES (
      v_prod.id,
      v_prod.name,
      v_prod.sku,
      'goods_received'::stock_movement_type,
      v_item.receivedQty,
      v_prev_stock,
      v_new_stock,
      v_prod.purchase_cost,
      v_item.receivedQty * v_prod.purchase_cost,
      v_po.po_number,
      p_warehouse_location,
      'Goods receipt for PO ' || v_po.po_number || ' from ' || v_po.supplier_name,
      p_user_id,
      p_user_name,
      v_now
    );
  END LOOP;

  -- Update PO received quantities
  FOR v_po_item IN SELECT * FROM jsonb_array_elements(v_po.items) LOOP
    v_ord_qty := (v_po_item->>'orderedQuantity')::INT;
    v_already_rec := (v_po_item->>'receivedQuantity')::INT;
    
    -- Find if this product was received in this batch
    SELECT COALESCE(receivedQty, 0) INTO v_rec_qty
    FROM jsonb_to_recordset(p_received_items) AS x(productId UUID, receivedQty INT)
    WHERE x.productId = (v_po_item->>'productId')::UUID;
    
    v_already_rec := v_already_rec + COALESCE(v_rec_qty, 0);

    IF v_already_rec < v_ord_qty THEN
      v_all_received := FALSE;
    END IF;

    v_updated_items := v_updated_items || jsonb_set(v_po_item, '{receivedQuantity}', to_jsonb(v_already_rec));
  END LOOP;

  UPDATE purchase_orders
  SET items = v_updated_items,
      status = CASE WHEN v_all_received THEN 'received'::po_status ELSE 'partially_received'::po_status END
  WHERE id = p_po_id;

  -- Audit log
  INSERT INTO audit_logs (
    user_id,
    user_name,
    user_role,
    action,
    module,
    record_id,
    details,
    timestamp
  ) VALUES (
    p_user_id,
    p_user_name,
    'inventory_officer'::user_role,
    'GOODS_RECEIVED',
    'purchasing',
    v_po.po_number,
    'Received goods for PO ' || v_po.po_number || ' from ' || v_po.supplier_name,
    v_now
  );

  RETURN jsonb_build_object('success', true, 'poNumber', v_po.po_number);
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 4. STOCK ADJUSTMENT FUNCTION
-- Requires auditable reason, checks for negative balance, logs ledger entry.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_adjust_stock(
  p_product_id UUID,
  p_adjustment_qty INT,
  p_reason TEXT,
  p_warehouse_location VARCHAR,
  p_user_id UUID,
  p_user_name VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_prod RECORD;
  v_prev_stock INT;
  v_new_stock INT;
  v_now TIMESTAMPTZ := timezone('utc', now());
BEGIN
  IF p_adjustment_qty = 0 THEN
    RAISE EXCEPTION 'Adjustment quantity cannot be 0';
  END IF;

  IF trim(COALESCE(p_reason, '')) = '' THEN
    RAISE EXCEPTION 'Auditable reason is mandatory for stock adjustment';
  END IF;

  SELECT * INTO v_prod FROM products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  v_prev_stock := v_prod.current_stock;
  v_new_stock := v_prev_stock + p_adjustment_qty;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock balance cannot be negative. Current: %, Adjustment: %',
      v_prev_stock, p_adjustment_qty;
  END IF;

  UPDATE products
  SET current_stock = v_new_stock
  WHERE id = p_product_id;

  INSERT INTO stock_movements (
    product_id,
    product_name,
    sku,
    type,
    quantity,
    previous_stock,
    new_stock,
    unit_cost,
    total_cost,
    reference_id,
    warehouse_location,
    reason,
    performed_by_user_id,
    performed_by_user_name,
    created_at
  ) VALUES (
    v_prod.id,
    v_prod.name,
    v_prod.sku,
    CASE WHEN p_adjustment_qty > 0 THEN 'adjustment_positive'::stock_movement_type ELSE 'adjustment_negative'::stock_movement_type END,
    p_adjustment_qty,
    v_prev_stock,
    v_new_stock,
    v_prod.purchase_cost,
    abs(p_adjustment_qty) * v_prod.purchase_cost,
    'ADJ-' || to_char(v_now, 'YYYYMMDD-HH24MI'),
    p_warehouse_location,
    p_reason,
    p_user_id,
    p_user_name,
    v_now
  );

  INSERT INTO audit_logs (
    user_id,
    user_name,
    user_role,
    action,
    module,
    record_id,
    details,
    timestamp
  ) VALUES (
    p_user_id,
    p_user_name,
    'manager'::user_role,
    'STOCK_ADJUSTMENT',
    'inventory',
    v_prod.sku,
    'Adjusted ' || v_prod.name || ' by ' || p_adjustment_qty || '. Reason: ' || p_reason,
    v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'previousStock', v_prev_stock,
    'newStock', v_new_stock
  );
END;
$$ LANGUAGE plpgsql;
