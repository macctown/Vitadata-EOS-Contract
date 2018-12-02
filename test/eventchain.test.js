import { initAPI, rpc } from './utils/initAPI';
import { events, deposits } from './utils/helper';
import { data_user_deposit, data_owner_deposit, reward, refund  } from './utils/actions';

const userA = initAPI('5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5');
const userB = initAPI('5KLqT1UFxVnKRWkjvhFur4sECrPhciuUqsYRihc1p9rxhXQMZBg');
const userC = initAPI('5K2jun7wohStgiCDSDYjk3eteRH1KaxUQsZTEmTGPH4GS9vVFb7');
const userD = initAPI('5KNm1BgaopP9n5NqJDo9rbr49zJFWJTMJheLoLM5b7gjdhqAwCx');
test('user transfer to event chain should add event', async () => {
  await userA.transact({ actions: [data_user_deposit(
    'useraaaaaaaa', '10.0000 SYS', 'eventnameaaa'
    )] }, { blocksBehind: 3, expireSeconds: 30, });
  const [event] = await events();
  expect(event.user).toBe('useraaaaaaaa');
  expect(event.event_name).toBe('eventnameaaa');
  expect(event.reward).toBe('10.0000 SYS');
});

test('owner transfer to event chain should add deposit', async () => {
  await userB.transact({
    actions: [data_owner_deposit(
      'useraaaaaaab', '10.0000 SYS', 'eventnameaaa'
    )]
  }, { blocksBehind: 3, expireSeconds: 30, });
  const [deposit] = await deposits({ event_name: 'eventnameaaa'});
  expect(deposit.user).toBe('useraaaaaaab');
  expect(deposit.deposit).toBe('10.0000 SYS');
});

test('more owner transfer to event chain should add deposit', async () => {
  await userC.transact({
    actions: [data_owner_deposit(
      'useraaaaaaac', '10.0000 SYS', 'eventnameaaa'
    )]
  }, { blocksBehind: 3, expireSeconds: 30, });
  const [depositB, depositC] = await deposits({ event_name: 'eventnameaaa' });
  expect(depositC.user).toBe('useraaaaaaac');
  expect(depositC.deposit).toBe('10.0000 SYS');
});

test('reward should clear all deposit', async () => {
  await userA.transact({
    actions: [reward(
      'useraaaaaaaa', 'useraaaaaaab', 'eventnameaaa'
    )]
  }, { blocksBehind: 3, expireSeconds: 30, });
  const eventList = await events();
  expect(eventList.length).toBe(0);
  // cleos get table eventchainac useraaaaaaaa depostruct
  // cleos get table eventchainac eventchainac eventstruct
  await userB.transact({
    actions: [refund('useraaaaaaab', 'eventnameaaa')]
  }, { blocksBehind: 3, expireSeconds: 30, });
  await userC.transact({
    actions: [refund('useraaaaaaac', 'eventnameaaa')]
  }, { blocksBehind: 3, expireSeconds: 30, });
  const depositList = await deposits({ event_name: 'eventnameaaa' });
  expect(depositList.length).toBe(0);
}, 15000);