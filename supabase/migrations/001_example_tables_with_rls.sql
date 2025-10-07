-- Voltura Service Hub schema and security baseline
set check_function_bodies = off;

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
drop type if exists public.job_status cascade;
create type public.job_status as enum (
    'pending',
    'in_progress',
    'awaiting_customer',
    'awaiting_parts',
    'completed',
    'delivered',
    'cancelled'
);

drop type if exists public.job_priority cascade;
create type public.job_priority as enum (
    'low',
    'normal',
    'high',
    'urgent'
);

drop type if exists public.invoice_status cascade;
create type public.invoice_status as enum (
    'draft',
    'pending',
    'partial',
    'paid',
    'void'
);

drop type if exists public.payment_status cascade;
create type public.payment_status as enum (
    'pending',
    'authorized',
    'captured',
    'failed',
    'refunded'
);

drop type if exists public.payment_method cascade;
create type public.payment_method as enum (
    'cash',
    'card',
    'bank_transfer',
    'ewallet',
    'store_credit'
);

drop type if exists public.stock_movement_type cascade;
create type public.stock_movement_type as enum (
    'adjustment',
    'sale',
    'return',
    'purchase',
    'transfer',
    'consumption'
);

drop type if exists public.message_direction cascade;
create type public.message_direction as enum (
    'incoming',
    'outgoing'
);

drop type if exists public.message_status cascade;
create type public.message_status as enum (
    'queued',
    'sent',
    'delivered',
    'read',
    'failed'
);

drop type if exists public.message_type cascade;
create type public.message_type as enum (
    'text',
    'media',
    'template',
    'system'
);

drop type if exists public.campaign_status cascade;
create type public.campaign_status as enum (
    'draft',
    'scheduled',
    'running',
    'completed',
    'cancelled'
);

drop type if exists public.template_category cascade;
create type public.template_category as enum (
    'system',
    'reminder',
    'marketing',
    'support'
);

-- ---------------------------------------------------------------------------
-- Sequences
-- ---------------------------------------------------------------------------
create sequence if not exists public.job_number_seq start with 1000;
create sequence if not exists public.invoice_number_seq start with 1000;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------
create table if not exists public.app_roles (
    key text primary key,
    name text not null,
    description text,
    is_default boolean not null default false,
    created_at timestamptz not null default now()
);

create unique index if not exists app_roles_name_key on public.app_roles (lower(name));

create table if not exists public.user_roles (
    user_id uuid not null references auth.users (id) on delete cascade,
    role_key text not null references public.app_roles (key) on delete cascade,
    granted_at timestamptz not null default now(),
    granted_by uuid references auth.users (id),
    primary key (user_id, role_key)
);

create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users (id) on delete cascade,
    full_name text not null,
    display_name text,
    phone text,
    role_key text references public.app_roles (key),
    avatar_url text,
    timezone text not null default 'Asia/Kuala_Lumpur',
    settings jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists profiles_role_key_idx on public.profiles (role_key);

create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    external_id text,
    full_name text not null,
    phone text not null,
    email text,
    customer_type text not null default 'retail',
    preferred_language text default 'ms',
    whatsapp_opt_in boolean not null default true,
    last_visit_at timestamptz,
    tags text[] not null default '{}'::text[],
    total_spent numeric(12, 2) not null default 0,
    outstanding_balance numeric(12, 2) not null default 0,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint customers_phone_unique unique (phone),
    constraint customers_email_unique unique (email)
);

create index if not exists customers_last_visit_idx on public.customers (last_visit_at desc nulls last);
create index if not exists customers_tags_idx on public.customers using gin (tags);

create table if not exists public.devices (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers (id) on delete cascade,
    device_type text not null,
    brand text,
    model text,
    serial_number text,
    imei text,
    purchase_date date,
    warranty_expiry date,
    color text,
    notes text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists devices_customer_idx on public.devices (customer_id);
create index if not exists devices_model_idx on public.devices (lower(model));
create unique index if not exists devices_serial_unique on public.devices (customer_id, serial_number) where serial_number is not null;

create table if not exists public.inventory_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

create table if not exists public.inventory_locations (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    contact_name text,
    email text,
    phone text,
    address text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists suppliers_name_unique on public.suppliers (lower(name));

create table if not exists public.inventory_items (
    id uuid primary key default gen_random_uuid(),
    sku text not null,
    barcode text,
    name text not null,
    description text,
    category_id uuid references public.inventory_categories (id) on delete set null,
    supplier_id uuid references public.suppliers (id) on delete set null,
    location_id uuid references public.inventory_locations (id) on delete set null,
    cost_price numeric(12, 2) not null default 0,
    sale_price numeric(12, 2) not null default 0,
    quantity_on_hand numeric(12, 2) not null default 0,
    reorder_level numeric(12, 2) not null default 0,
    reorder_quantity numeric(12, 2) not null default 0,
    is_active boolean not null default true,
    allow_negative_stock boolean not null default false,
    warranty_months integer not null default 0,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint inventory_items_sku_unique unique (sku)
);

create index if not exists inventory_items_active_idx on public.inventory_items (is_active);
create index if not exists inventory_items_category_idx on public.inventory_items (category_id);
create index if not exists inventory_items_supplier_idx on public.inventory_items (supplier_id);

create table if not exists public.jobs (
    id uuid primary key default gen_random_uuid(),
    job_number text not null unique default concat('JOB-', to_char(now(), 'YYYYMMDD'), '-', lpad(nextval('public.job_number_seq')::text, 4, '0')),
    customer_id uuid not null references public.customers (id) on delete restrict,
    device_id uuid references public.devices (id) on delete set null,
    status public.job_status not null default 'pending',
    priority public.job_priority not null default 'normal',
    problem_description text,
    diagnosis text,
    resolution text,
    sla_due_at timestamptz,
    assigned_to uuid references public.profiles (id) on delete set null,
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    estimated_cost numeric(12, 2),
    approved_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    delivered_at timestamptz,
    cancelled_at timestamptz,
    location text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists jobs_customer_idx on public.jobs (customer_id);
create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_assigned_idx on public.jobs (assigned_to);
create index if not exists jobs_created_idx on public.jobs (created_at desc);

create table if not exists public.job_events (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references public.jobs (id) on delete cascade,
    event_type text not null,
    old_value text,
    new_value text,
    description text,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists job_events_job_idx on public.job_events (job_id, created_at desc);

create table if not exists public.message_templates (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    category public.template_category not null default 'system',
    language text not null default 'ms',
    channel text not null default 'whatsapp',
    body text not null,
    variables text[] not null default '{}'::text[],
    is_active boolean not null default true,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists message_templates_category_idx on public.message_templates (category);
create index if not exists message_templates_active_idx on public.message_templates (is_active);

create table if not exists public.campaigns (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    status public.campaign_status not null default 'draft',
    scheduled_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    total_targets integer not null default 0,
    total_sent integer not null default 0,
    total_delivered integer not null default 0,
    total_read integer not null default 0,
    filters jsonb not null default '{}'::jsonb,
    message_template_id uuid references public.message_templates (id) on delete set null,
    created_by uuid references public.profiles (id) on delete set null,
    approved_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_scheduled_idx on public.campaigns (scheduled_at);

create table if not exists public.campaign_targets (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references public.campaigns (id) on delete cascade,
    customer_id uuid references public.customers (id) on delete set null,
    phone text not null,
    status public.message_status not null default 'queued',
    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    error text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists campaign_targets_status_idx on public.campaign_targets (campaign_id, status);
create index if not exists campaign_targets_phone_idx on public.campaign_targets (phone);

create table if not exists public.message_logs (
    id uuid primary key default gen_random_uuid(),
    message_sid text,
    campaign_id uuid references public.campaigns (id) on delete set null,
    campaign_target_id uuid references public.campaign_targets (id) on delete set null,
    customer_id uuid references public.customers (id) on delete set null,
    device_id uuid references public.devices (id) on delete set null,
    job_id uuid references public.jobs (id) on delete set null,
    direction public.message_direction not null,
    message_type public.message_type not null default 'text',
    status public.message_status not null default 'queued',
    template_key text references public.message_templates (key),
    content text,
    media_urls text[] not null default '{}'::text[],
    metadata jsonb not null default '{}'::jsonb,
    sent_by uuid references public.profiles (id) on delete set null,
    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    error text,
    created_at timestamptz not null default now()
);

create index if not exists message_logs_customer_idx on public.message_logs (customer_id, created_at desc);
create index if not exists message_logs_campaign_idx on public.message_logs (campaign_id, created_at desc);
create index if not exists message_logs_job_idx on public.message_logs (job_id);
create index if not exists message_logs_status_idx on public.message_logs (direction, status);

create table if not exists public.invoices (
    id uuid primary key default gen_random_uuid(),
    invoice_number text not null unique default concat('INV-', to_char(now(), 'YYYYMMDD'), '-', lpad(nextval('public.invoice_number_seq')::text, 4, '0')),
    job_id uuid references public.jobs (id) on delete set null,
    customer_id uuid not null references public.customers (id) on delete restrict,
    status public.invoice_status not null default 'draft',
    issue_date date not null default current_date,
    due_date date,
    subtotal numeric(12, 2) not null default 0,
    tax_amount numeric(12, 2) not null default 0,
    discount_amount numeric(12, 2) not null default 0,
    total_amount numeric(12, 2) generated always as ((subtotal - discount_amount) + tax_amount) stored,
    balance_due numeric(12, 2) not null default 0,
    notes text,
    sent_at timestamptz,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists invoices_customer_idx on public.invoices (customer_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_due_idx on public.invoices (due_date);

create table if not exists public.invoice_line_items (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoices (id) on delete cascade,
    job_id uuid references public.jobs (id) on delete set null,
    inventory_item_id uuid references public.inventory_items (id) on delete set null,
    description text not null,
    quantity numeric(12, 2) not null default 1,
    unit_price numeric(12, 2) not null default 0,
    discount numeric(12, 2) not null default 0,
    tax_rate numeric(5, 2) not null default 0,
    total numeric(12, 2) generated always as (((quantity * unit_price) - discount) + (((quantity * unit_price) - discount) * tax_rate / 100)) stored,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists invoice_line_items_invoice_idx on public.invoice_line_items (invoice_id);

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoices (id) on delete cascade,
    job_id uuid references public.jobs (id) on delete set null,
    amount numeric(12, 2) not null,
    method public.payment_method not null,
    status public.payment_status not null default 'pending',
    paid_at timestamptz not null default now(),
    reference text,
    notes text,
    received_by uuid references public.profiles (id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists payments_invoice_idx on public.payments (invoice_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_paid_idx on public.payments (paid_at desc);

create table if not exists public.stock_movements (
    id uuid primary key default gen_random_uuid(),
    inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
    movement_type public.stock_movement_type not null,
    quantity numeric(12, 2) not null,
    resulting_quantity numeric(12, 2),
    source_job_id uuid references public.jobs (id) on delete set null,
    source_invoice_id uuid references public.invoices (id) on delete set null,
    reference_number text,
    notes text,
    performed_by uuid references public.profiles (id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists stock_movements_item_idx on public.stock_movements (inventory_item_id, created_at desc);
create index if not exists stock_movements_type_idx on public.stock_movements (movement_type);

create table if not exists public.audit_logs (
    id bigserial primary key,
    actor_id uuid references public.profiles (id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    description text,
    changes jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.is_authenticated()
returns boolean
language sql
stable
as $$
    select auth.uid() is not null;
$$;

create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from public.user_roles ur
        where ur.role_key = role_key
          and ur.user_id = auth.uid()
    );
$$;

create or replace function public.has_any_role(role_keys text[])
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role_key = any(role_keys)
    );
$$;

create or replace function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Update triggers
-- ---------------------------------------------------------------------------
create trigger set_updated_at_profiles
    before update on public.profiles
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_customers
    before update on public.customers
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_devices
    before update on public.devices
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_inventory_items
    before update on public.inventory_items
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_suppliers
    before update on public.suppliers
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_jobs
    before update on public.jobs
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_message_templates
    before update on public.message_templates
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_campaigns
    before update on public.campaigns
    for each row
    execute function public.trigger_set_updated_at();

create trigger set_updated_at_invoices
    before update on public.invoices
    for each row
    execute function public.trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security policies
-- ---------------------------------------------------------------------------
alter table public.app_roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.inventory_categories enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.jobs enable row level security;
alter table public.job_events enable row level security;
alter table public.message_templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_targets enable row level security;
alter table public.message_logs enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;
alter table public.stock_movements enable row level security;
alter table public.audit_logs enable row level security;

-- app_roles policies
create policy app_roles_read_authenticated on public.app_roles
    for select using (public.is_authenticated());

create policy app_roles_manage_admin on public.app_roles
    for all using (public.has_role('admin')) with check (public.has_role('admin'));

-- user_roles policies
create policy user_roles_read_self_or_admin on public.user_roles
    for select using (public.has_any_role(array['admin','manager']) or auth.uid() = user_id);

create policy user_roles_manage_admin on public.user_roles
    for all using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

-- profiles policies
create policy profiles_read_self_or_admin on public.profiles
    for select using (public.has_any_role(array['admin','manager']) or auth.uid() = user_id);

create policy profiles_update_self on public.profiles
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy profiles_manage_admin on public.profiles
    for all using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

-- customers policies
create policy customers_read_team on public.customers
    for select using (public.has_any_role(array['admin','manager','technician','cashier','marketing','support']));

create policy customers_manage_core on public.customers
    for insert with check (public.has_any_role(array['admin','manager','cashier','support']));

create policy customers_update_core on public.customers
    for update using (public.has_any_role(array['admin','manager','cashier','support']))
    with check (public.has_any_role(array['admin','manager','cashier','support']));

create policy customers_delete_admin on public.customers
    for delete using (public.has_role('admin'));

-- devices policies
create policy devices_read_team on public.devices
    for select using (public.has_any_role(array['admin','manager','technician','cashier','support']));

create policy devices_write_core on public.devices
    for insert with check (public.has_any_role(array['admin','manager','technician','support']));

create policy devices_update_core on public.devices
    for update using (public.has_any_role(array['admin','manager','technician','support']))
    with check (public.has_any_role(array['admin','manager','technician','support']));

create policy devices_delete_admin on public.devices
    for delete using (public.has_role('admin'));

-- inventory reference tables
create policy inventory_categories_read_team on public.inventory_categories
    for select using (public.has_any_role(array['admin','manager','technician','cashier','support']));

create policy inventory_categories_manage_admin on public.inventory_categories
    for all using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

create policy inventory_locations_read_team on public.inventory_locations
    for select using (public.has_any_role(array['admin','manager','technician','cashier','support']));

create policy inventory_locations_manage_admin on public.inventory_locations
    for all using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

create policy suppliers_read_team on public.suppliers
    for select using (public.has_any_role(array['admin','manager','cashier','support']));

create policy suppliers_manage_admin on public.suppliers
    for all using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

-- inventory items and stock movements
create policy inventory_items_read_team on public.inventory_items
    for select using (public.has_any_role(array['admin','manager','technician','cashier','support']));

create policy inventory_items_manage_admin on public.inventory_items
    for all using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

create policy stock_movements_read_team on public.stock_movements
    for select using (public.has_any_role(array['admin','manager','technician','cashier','support']));

create policy stock_movements_manage_core on public.stock_movements
    for insert with check (public.has_any_role(array['admin','manager','cashier']));

create policy stock_movements_update_admin on public.stock_movements
    for update using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

-- jobs & events
create policy jobs_read_team on public.jobs
    for select using (public.has_any_role(array['admin','manager','technician','support']));

create policy jobs_insert_core on public.jobs
    for insert with check (public.has_any_role(array['admin','manager','support']));

create policy jobs_update_team on public.jobs
    for update using (public.has_any_role(array['admin','manager','technician','support']))
    with check (public.has_any_role(array['admin','manager','technician','support']));

create policy jobs_delete_admin on public.jobs
    for delete using (public.has_role('admin'));

create policy job_events_read_team on public.job_events
    for select using (public.has_any_role(array['admin','manager','technician','support']));

create policy job_events_insert_team on public.job_events
    for insert with check (public.has_any_role(array['admin','manager','technician','support']));

-- messaging and campaigns
create policy message_templates_read_team on public.message_templates
    for select using (public.has_any_role(array['admin','manager','marketing','support']));

create policy message_templates_manage_marketing on public.message_templates
    for all using (public.has_any_role(array['admin','manager','marketing']))
    with check (public.has_any_role(array['admin','manager','marketing']));

create policy campaigns_read_team on public.campaigns
    for select using (public.has_any_role(array['admin','manager','marketing','support']));

create policy campaigns_manage_marketing on public.campaigns
    for all using (public.has_any_role(array['admin','manager','marketing']))
    with check (public.has_any_role(array['admin','manager','marketing']));

create policy campaign_targets_read_team on public.campaign_targets
    for select using (public.has_any_role(array['admin','manager','marketing','support']));

create policy campaign_targets_manage_marketing on public.campaign_targets
    for all using (public.has_any_role(array['admin','manager','marketing']))
    with check (public.has_any_role(array['admin','manager','marketing']));

create policy message_logs_read_team on public.message_logs
    for select using (public.has_any_role(array['admin','manager','marketing','support']));

create policy message_logs_insert_team on public.message_logs
    for insert with check (public.has_any_role(array['admin','manager','marketing','support']));

create policy message_logs_update_admin on public.message_logs
    for update using (public.has_any_role(array['admin','manager']))
    with check (public.has_any_role(array['admin','manager']));

-- billing
create policy invoices_read_team on public.invoices
    for select using (public.has_any_role(array['admin','manager','cashier','support']));

create policy invoices_manage_cashier on public.invoices
    for all using (public.has_any_role(array['admin','manager','cashier']))
    with check (public.has_any_role(array['admin','manager','cashier']));

create policy invoice_line_items_read_team on public.invoice_line_items
    for select using (public.has_any_role(array['admin','manager','cashier','support']));

create policy invoice_line_items_manage_cashier on public.invoice_line_items
    for all using (public.has_any_role(array['admin','manager','cashier']))
    with check (public.has_any_role(array['admin','manager','cashier']));

create policy payments_read_team on public.payments
    for select using (public.has_any_role(array['admin','manager','cashier','support']));

create policy payments_manage_cashier on public.payments
    for all using (public.has_any_role(array['admin','manager','cashier']))
    with check (public.has_any_role(array['admin','manager','cashier']));

-- audit logs restricted to leadership
create policy audit_logs_read_admin on public.audit_logs
    for select using (public.has_any_role(array['admin','manager']));

create policy audit_logs_manage_admin on public.audit_logs
    for insert with check (public.has_any_role(array['admin','manager']));

