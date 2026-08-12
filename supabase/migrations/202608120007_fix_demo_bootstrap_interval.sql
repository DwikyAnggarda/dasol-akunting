begin;

-- Migration 006 is already deployed, so correct its function with a forward
-- migration instead of rewriting applied history. PostgreSQL requires spaces
-- between the interval components.
do $migration$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.bootstrap_demo_company(jsonb)'::regprocedure)
  into function_definition;

  if position('1 month-1 day' in function_definition) = 0 then
    raise exception 'Expected demo bootstrap interval expression was not found';
  end if;

  function_definition := replace(
    function_definition,
    '''1 month-1 day''',
    '''1 month - 1 day'''
  );
  execute function_definition;
end;
$migration$;

commit;
