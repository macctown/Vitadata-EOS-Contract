export function data_user_deposit(from, quantity, event_name) {
  return {
    account: 'eosio.token',
    name: 'transfer',
    authorization: [{ actor: from, permission: 'active' }],
    data: { from: from, to: 'eventchainac', quantity: quantity, memo: `u${event_name}` },
  };
}
export function data_owner_deposit(from, quantity, event_name) {
  return {
    account: 'eosio.token',
    name: 'transfer',
    authorization: [{ actor: from, permission: 'active' }],
    data: { from: from, to: 'eventchainac', quantity: quantity, memo: `o${event_name}` },
  };
}

export function reward(from, to, event_name) {
  return {
    account: 'eventchainac',
    name: 'reward',
    authorization: [{ actor: from, permission: 'active' }],
    data: { user: from, owner: to, event_name},
  };
}

export function refund(owner, event_name) {
  return {
    account: 'eventchainac',
    name: 'refund',
    authorization: [{ actor: owner, permission: 'active' }],
    data: { owner, event_name },
  };
}