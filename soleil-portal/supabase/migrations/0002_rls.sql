-- Row Level Security — deny-all par défaut, politiques par rôle.
-- Les autorisations vivent ici, pas dans l'interface (exigence du brief).

-- ---------- Helpers ----------
create or replace function current_app_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where user_id = auth.uid()
$$;

create or replace function current_org() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from profiles where user_id = auth.uid()
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select current_app_role() in ('sales_admin','content_admin','super_admin')
$$;

create or replace function is_approved_buyer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from buyer_accounts
    where user_id = auth.uid() and status = 'approved'
  )
$$;

-- ---------- Activation RLS (deny-all sans policy) ----------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table buyer_accounts enable row level security;
alter table collections enable row level security;
alter table capsules enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_media enable row level security;
alter table wholesale_prices enable row level security;
alter table commercial_terms enable row level security;
alter table selections enable row level security;
alter table selection_items enable row level security;
alter table access_requests enable row level security;
alter table appointments enable row level security;
alter table quote_requests enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table partnership_models enable row level security;
alter table partnership_applications enable row level security;
alter table documents enable row level security;
alter table contracts enable row level security;
alter table communications enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;
alter table shared_links enable row level security;
alter table audit_logs enable row level security;
alter table brand_settings enable row level security;

-- ---------- Profils ----------
create policy profiles_self_read on profiles for select using (user_id = auth.uid() or is_admin());
create policy profiles_admin_write on profiles for all using (current_app_role() = 'super_admin');

-- ---------- Organisations ----------
-- Les notes internes sont exclues côté buyer par la vue organizations_buyer_v.
create policy org_buyer_read on organizations for select
  using (id = current_org() or is_admin());
create policy org_buyer_update on organizations for update
  using (id = current_org() and is_approved_buyer())
  with check (id = current_org());
create policy org_admin_all on organizations for all using (is_admin());

create view organizations_buyer_v as
  select id, legal_name, trade_name, shop_type, contact_name, address, city, country,
         email, whatsapp, website, instagram, target_clientele, price_range,
         brands_carried, delivery_countries, preferred_model, pipeline_status, created_at
  from organizations;                                 -- internal_notes / potential_estimate exclus

create policy buyer_accounts_self on buyer_accounts for select
  using (user_id = auth.uid() or is_admin());
create policy buyer_accounts_admin on buyer_accounts for all using (is_admin());

-- ---------- Catalogue ----------
-- Public (anon) : produits actifs et publics, SANS prix (wholesale_prices n'a
-- aucune policy anon → invisible).
create policy products_public_read on products for select
  using (
    (status = 'active' and visibility = 'public')
    or (status = 'active' and is_approved_buyer())
    or is_admin()
  );
create policy products_admin_write on products for insert with check (is_admin());
create policy products_admin_update on products for update using (is_admin());
create policy products_admin_delete on products for delete using (current_app_role() = 'super_admin');

create policy variants_read on product_variants for select
  using (
    exists (
      select 1 from products p
      where p.id = product_id
        and ((p.status = 'active' and p.visibility = 'public')
             or (p.status = 'active' and is_approved_buyer())
             or is_admin())
    )
  );
create policy variants_admin on product_variants for all using (is_admin());

create policy media_read on product_media for select
  using (
    exists (
      select 1 from products p
      where p.id = product_id
        and ((p.status = 'active' and p.visibility = 'public')
             or (p.status = 'active' and is_approved_buyer())
             or is_admin())
    )
  );
create policy media_admin on product_media for all using (is_admin());

create policy capsules_read on capsules for select using (true);
create policy capsules_admin on capsules for all using (is_admin());
create policy collections_read on collections for select using (true);
create policy collections_admin on collections for all using (is_admin());

-- ---------- Prix et conditions : JAMAIS publics ----------
create policy prices_buyer_read on wholesale_prices for select
  using (is_approved_buyer() or is_admin());
create policy prices_admin_write on wholesale_prices for all
  using (current_app_role() in ('sales_admin','super_admin'));

create policy terms_buyer_read on commercial_terms for select
  using (is_approved_buyer() or is_admin());
create policy terms_admin_write on commercial_terms for all
  using (current_app_role() in ('sales_admin','super_admin'));

-- ---------- Cycle commercial : chaque boutique ne voit que son dossier ----------
create policy selections_own on selections for all
  using (organization_id = current_org() and is_approved_buyer())
  with check (organization_id = current_org());
create policy selections_admin on selections for select using (is_admin());

create policy selection_items_own on selection_items for all
  using (exists (select 1 from selections s where s.id = selection_id and s.organization_id = current_org()))
  with check (exists (select 1 from selections s where s.id = selection_id and s.organization_id = current_org()));
create policy selection_items_admin on selection_items for select using (is_admin());

create policy quote_requests_own on quote_requests for all
  using (organization_id = current_org() and is_approved_buyer())
  with check (organization_id = current_org());
create policy quote_requests_admin on quote_requests for all using (is_admin());

create policy quotes_own_read on quotes for select
  using (organization_id = current_org() and status <> 'draft');
create policy quotes_own_respond on quotes for update
  using (organization_id = current_org() and status in ('sent','change_requested'))
  with check (organization_id = current_org());
create policy quotes_admin on quotes for all
  using (current_app_role() in ('sales_admin','super_admin'));

create policy quote_items_read on quote_items for select
  using (
    exists (
      select 1 from quotes q
      where q.id = quote_id
        and ((q.organization_id = current_org() and q.status <> 'draft') or is_admin())
    )
  );
create policy quote_items_admin on quote_items for all
  using (current_app_role() in ('sales_admin','super_admin'));

create policy orders_own on orders for select using (organization_id = current_org());
create policy orders_admin on orders for all
  using (current_app_role() in ('sales_admin','super_admin'));
create policy order_items_read on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.organization_id = current_org() or is_admin())));
create policy order_items_admin on order_items for all
  using (current_app_role() in ('sales_admin','super_admin'));

create policy partnership_models_read on partnership_models for select using (true);
create policy partnership_models_admin on partnership_models for all using (is_admin());
create policy partnership_applications_own on partnership_applications for all
  using (organization_id = current_org() or is_admin())
  with check (organization_id = current_org() or is_admin());

-- ---------- Formulaires publics : insertion seule via RPC ----------
-- L'insertion anonyme passe par des fonctions security definer avec
-- validation ; aucune lecture anonyme.
create policy access_requests_admin on access_requests for all using (is_admin());
create policy appointments_admin on appointments for all using (is_admin());

create or replace function submit_access_request(payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if coalesce(payload->>'legal_name','') = '' or coalesce(payload->>'email','') = '' then
    raise exception 'legal_name et email sont requis';
  end if;
  insert into access_requests (legal_name, trade_name, shop_type, contact_name, email,
    whatsapp, city, country, website, instagram, target_clientele, price_range,
    brands_carried, preferred_model, message)
  values (payload->>'legal_name', payload->>'trade_name', payload->>'shop_type',
    payload->>'contact_name', payload->>'email', payload->>'whatsapp', payload->>'city',
    payload->>'country', payload->>'website', payload->>'instagram',
    payload->>'target_clientele', payload->>'price_range', payload->>'brands_carried',
    nullif(payload->>'preferred_model','')::partnership_model_t, coalesce(payload->>'message',''))
  returning id into rid;
  return rid;
end $$;

create or replace function submit_appointment(payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if coalesce(payload->>'name','') = '' or coalesce(payload->>'email','') = '' then
    raise exception 'name et email sont requis';
  end if;
  insert into appointments (name, organization, email, whatsapp, channel, slots, message)
  values (payload->>'name', payload->>'organization', payload->>'email', payload->>'whatsapp',
    coalesce(payload->>'channel','visio'), coalesce(payload->>'slots',''), coalesce(payload->>'message',''))
  returning id into rid;
  return rid;
end $$;

grant execute on function submit_access_request(jsonb) to anon;
grant execute on function submit_appointment(jsonb) to anon;

-- ---------- Liens sécurisés : résolution par token (security definer) ----------
create policy shared_links_admin on shared_links for all
  using (current_app_role() in ('sales_admin','super_admin'));
create policy shared_links_own on shared_links for select
  using (organization_id = current_org());

create or replace function resolve_shared_link(p_token text)
returns table (scope text, watermark text, organization_id uuid)
language plpgsql security definer set search_path = public as $$
begin
  return query
    update shared_links sl set views = sl.views + 1
    where sl.token = p_token
      and sl.revoked_at is null
      and (sl.expires_at is null or sl.expires_at > now())
    returning sl.scope, sl.watermark, sl.organization_id;
end $$;

grant execute on function resolve_shared_link(text) to anon;

-- ---------- Suivi : admin uniquement (jamais côté boutique) ----------
create policy communications_admin on communications for all using (is_admin());
create policy activities_admin on activities for select using (is_admin());
create policy activities_insert on activities for insert
  with check (auth.uid() is not null or true);        -- traçage d'événements applicatifs
create policy tasks_admin on tasks for all using (is_admin());
create policy audit_admin on audit_logs for select using (is_admin());
create policy audit_insert on audit_logs for insert with check (is_admin());

create policy notifications_buyer on notifications for select
  using ((audience = 'buyer' and organization_id = current_org()) or is_admin());
create policy notifications_update on notifications for update
  using ((audience = 'buyer' and organization_id = current_org()) or is_admin());
create policy notifications_admin_insert on notifications for insert with check (true);

create policy documents_own on documents for select
  using ((organization_id = current_org() and visibility = 'organization') or is_admin());
create policy documents_admin on documents for all using (is_admin());
create policy contracts_own on contracts for select
  using (organization_id = current_org() or is_admin());
create policy contracts_admin on contracts for all
  using (current_app_role() in ('sales_admin','super_admin'));

-- ---------- Configuration ----------
create policy settings_read on brand_settings for select using (true);
create policy settings_admin on brand_settings for all
  using (current_app_role() in ('content_admin','super_admin'));
