begin;
select plan(11);

select col_type_is('public','journal_entries','total_debit','numeric(24,4)','journal debit uses numeric');
select col_type_is('public','journal_lines','debit','numeric(24,4)','journal line debit uses numeric');
select col_type_is('public','inventory_movements','quantity','numeric(24,6)','inventory quantity uses numeric');
select has_index('public','journal_entries','journal_posted_source_uidx','posted source has duplicate protection');
select has_function('public','next_document_number',array['uuid','text','date','uuid'],'atomic numbering exists');
select has_function('public','post_manual_journal',array['uuid','date','text','jsonb','text','uuid'],'manual posting RPC exists');
select has_function('public','reverse_journal_entry',array['uuid','uuid','date','text','text'],'reversal RPC exists');
select has_trigger('public','journal_entries','journal_entries_immutable','posted entry immutability trigger exists');
select has_trigger('public','journal_lines','journal_lines_immutable','posted line immutability trigger exists');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='journal_entries'),1,'journal entry has read RLS policy only');
select is((select relrowsecurity from pg_class where oid='public.journal_entries'::regclass),true,'journal entry RLS is enabled');

select * from finish();
rollback;
