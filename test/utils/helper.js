import { rpc } from './initAPI';
export async function events() {
  const query = { code: 'eventchainac', scope: 'eventchainac', table: 'eventstruct' };
  const { rows } = await rpc.get_table_rows(query);
  return rows;
}

export async function deposits({ event_name}) {
  const query = { code: 'eventchainac', scope: event_name, table: 'depostruct' };
  const { rows } = await rpc.get_table_rows(query);
  return rows;
}

