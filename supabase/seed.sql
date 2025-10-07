-- Seed data for Voltura Service Hub
-- Loads baseline roles, admin account, and default messaging templates

set check_function_bodies = off;
set search_path = public;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
insert into public.app_roles (key, name, description, is_default)
values
    ('admin', 'Administrator', 'Full system access with oversight of all modules.', false),
    ('manager', 'Operations Manager', 'Coordinates technicians, approvals, and finance.', false),
    ('technician', 'Technician', 'Handles diagnostics, repairs, and job updates.', false),
    ('cashier', 'Cashier', 'Manages POS, invoices, and payments.', false),
    ('marketing', 'Marketing', 'Runs campaigns and manages messaging templates.', false),
    ('support', 'Support', 'Customer success and WhatsApp concierge roles.' , true)
on conflict (key) do update set
    name = excluded.name,
    description = excluded.description,
    is_default = excluded.is_default;

-- ---------------------------------------------------------------------------
-- Default admin user (email/password: admin@example.com / VolturaAdmin123!)
-- ---------------------------------------------------------------------------
with admin_user as (
    insert into auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        aud,
        role
    )
    values (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'admin@example.com',
        crypt('VolturaAdmin123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        now(),
        now(),
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('full_name', 'Voltura Admin'),
        false,
        now(),
        now(),
        'authenticated',
        'authenticated'
    )
    on conflict (id) do update set
        email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        updated_at = now()
    returning id
)
insert into public.profiles (id, user_id, full_name, display_name, phone, role_key, settings)
select
    coalesce(p.id, gen_random_uuid()),
    u.id,
    'Voltura Admin',
    'Admin',
    '+60123456789',
    'admin',
    jsonb_build_object('notification_channel', 'whatsapp')
from admin_user u
left join public.profiles p on p.user_id = u.id
on conflict (user_id) do update set
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    phone = excluded.phone,
    role_key = excluded.role_key;

insert into public.user_roles (user_id, role_key, granted_at)
select id, 'admin', now() from auth.users where email = 'admin@example.com'
on conflict (user_id, role_key) do update set granted_at = excluded.granted_at;

insert into public.user_roles (user_id, role_key, granted_at)
select id, 'manager', now() from auth.users where email = 'admin@example.com'
on conflict (user_id, role_key) do update set granted_at = excluded.granted_at;

-- ---------------------------------------------------------------------------
-- Messaging templates & sample campaign
-- ---------------------------------------------------------------------------
insert into public.message_templates (key, name, category, language, channel, body, variables, is_active)
values
    (
        'repair_intake_confirmation',
        'Repair Intake Confirmation',
        'system',
        'ms',
        'whatsapp',
        'Hai {nama}, kami telah menerima peranti {model} anda. Nombor tiket: {job_number}.',
        array['nama','model','job_number'],
        true
    ),
    (
        'repair_completed_ready',
        'Repair Completed Ready for Pickup',
        'reminder',
        'ms',
        'whatsapp',
        'Hai {nama}, pembaikan untuk {device} telah siap. Sila kunjungi kami untuk pengambilan dalam masa {pickup_window}.',
        array['nama','device','pickup_window'],
        true
    ),
    (
        'invoice_payment_due',
        'Invoice Payment Reminder',
        'reminder',
        'ms',
        'whatsapp',
        'Salam {nama}, ini peringatan bahawa invois #{invoice_number} bernilai {amount_due} masih belum dibayar.',
        array['nama','invoice_number','amount_due'],
        true
    ),
    (
        'dormant_customer_reengage',
        'Dormant Customer Re-engagement',
        'marketing',
        'ms',
        'whatsapp',
        'Hai {nama}! Kami rindu anda di Voltura. Nikmati diskaun {offer} untuk servis seterusnya sebelum {expiry_date}.',
        array['nama','offer','expiry_date'],
        true
    )
on conflict (key) do update set
    name = excluded.name,
    category = excluded.category,
    language = excluded.language,
    channel = excluded.channel,
    body = excluded.body,
    variables = excluded.variables,
    is_active = excluded.is_active;

insert into public.campaigns (id, name, description, status, scheduled_at, total_targets, filters, message_template_id, created_by)
select
    coalesce(c.id, gen_random_uuid()),
    'Welcome Back Campaign',
    'Reminder campaign for customers inactive for 90 days.',
    'scheduled',
    now() + interval '1 day',
    0,
    jsonb_build_object('last_visit_before', (now() - interval '90 days')::date),
    mt.id,
    p.id
from public.message_templates mt
join public.profiles p on p.user_id = (select id from auth.users where email = 'admin@example.com' limit 1)
left join public.campaigns c on c.name = 'Welcome Back Campaign'
where mt.key = 'dormant_customer_reengage'
on conflict (name) do update set
    status = excluded.status,
    scheduled_at = excluded.scheduled_at,
    filters = excluded.filters,
    message_template_id = excluded.message_template_id,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Baseline supplier, inventory, and demo customer/job data
-- ---------------------------------------------------------------------------
insert into public.suppliers (id, name, contact_name, email, phone, address)
select
    gen_random_uuid(),
    'Voltura Parts Hub',
    'Alex Tan',
    'sales@volturaparts.com',
    '+60312345678',
    'Petaling Jaya, Selangor'
where not exists (
    select 1 from public.suppliers where lower(name) = lower('Voltura Parts Hub')
);

insert into public.inventory_categories (name, description)
values ('Spare Parts', 'Replacement parts for repairs')
on conflict (name) do nothing;

insert into public.inventory_locations (name, description)
values ('Main Store', 'Primary storage location')
on conflict (name) do nothing;

insert into public.inventory_items (sku, name, description, category_id, supplier_id, location_id, cost_price, sale_price, quantity_on_hand, reorder_level, reorder_quantity)
select
    'LCD-IP13-BLK',
    'LCD Assembly - iPhone 13',
    'Original grade LCD replacement for iPhone 13',
    (select id from public.inventory_categories where name = 'Spare Parts' limit 1),
    (select id from public.suppliers where lower(name) = lower('Voltura Parts Hub') limit 1),
    (select id from public.inventory_locations where name = 'Main Store' limit 1),
    450.00,
    650.00,
    5,
    2,
    5
where not exists (select 1 from public.inventory_items where sku = 'LCD-IP13-BLK');

insert into public.customers (full_name, phone, email, customer_type, last_visit_at, tags)
select
    'Nadia Rahman',
    '+60129876543',
    'nadia@example.com',
    'retail',
    now() - interval '120 days',
    array['vip','whatsapp_optin']
where not exists (select 1 from public.customers where phone = '+60129876543');

insert into public.devices (customer_id, device_type, brand, model, serial_number, imei, purchase_date, warranty_expiry, notes)
select
    c.id,
    'smartphone',
    'Apple',
    'iPhone 13',
    'IP13-123456',
    '350020123456789',
    (current_date - interval '18 months')::date,
    (current_date - interval '6 months')::date,
    'Customer reports screen flickering'
from public.customers c
where c.phone = '+60129876543'
  and not exists (
        select 1 from public.devices d
        where d.customer_id = c.id and d.serial_number = 'IP13-123456'
    );

insert into public.jobs (customer_id, device_id, status, priority, problem_description, diagnosis, created_by, assigned_to)
select
    c.id,
    d.id,
    'awaiting_customer',
    'high',
    'Screen flickers and touch not responsive',
    'Requires LCD replacement',
    p.id,
    p.id
from public.customers c
join public.devices d on d.customer_id = c.id and d.serial_number = 'IP13-123456'
join public.profiles p on p.user_id = (select id from auth.users where email = 'admin@example.com' limit 1)
where not exists (select 1 from public.jobs where customer_id = c.id and device_id = d.id);

insert into public.invoices (job_id, customer_id, status, subtotal, tax_amount, discount_amount, balance_due, created_by)
select
    j.id,
    j.customer_id,
    'pending',
    650.00,
    39.00,
    0,
    689.00,
    p.id
from public.jobs j
join public.profiles p on p.user_id = (select id from auth.users where email = 'admin@example.com' limit 1)
where j.status = 'awaiting_customer'
  and not exists (select 1 from public.invoices where job_id = j.id);

insert into public.invoice_line_items (invoice_id, job_id, inventory_item_id, description, quantity, unit_price, discount, tax_rate)
select
    i.id,
    j.id,
    ii.id,
    'LCD Assembly - iPhone 13',
    1,
    650.00,
    0,
    6
from public.invoices i
join public.jobs j on j.id = i.job_id
join public.inventory_items ii on ii.sku = 'LCD-IP13-BLK'
where not exists (
    select 1 from public.invoice_line_items
    where invoice_id = i.id and inventory_item_id = ii.id
);

insert into public.message_logs (campaign_id, customer_id, job_id, direction, message_type, status, template_key, content, sent_by, sent_at)
select
    c.id,
    cust.id,
    j.id,
    'outgoing',
    'template',
    'sent',
    'repair_intake_confirmation',
    'Hai Nadia, kami telah menerima peranti iPhone 13 anda. Nombor tiket: ' || j.job_number || '.',
    p.id,
    now()
from public.campaigns c
join public.message_templates mt on mt.id = c.message_template_id
join public.customers cust on cust.phone = '+60129876543'
join public.jobs j on j.customer_id = cust.id
join public.profiles p on p.user_id = (select id from auth.users where email = 'admin@example.com' limit 1)
where c.name = 'Welcome Back Campaign'
  and not exists (
        select 1 from public.message_logs ml
        where ml.job_id = j.id and ml.template_key = 'repair_intake_confirmation'
    );

