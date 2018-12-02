#include <eosiolib/eosio.hpp>
#include <eosiolib/asset.hpp>

using namespace eosio;
using std::string;

CONTRACT eventchain : public eosio::contract {
  private:
    TABLE eventstruct {
      uint64_t      prim_key;
      name          user;
      name          event_name;
      asset         reward;
      uint64_t      timestamp;

      auto primary_key() const { return prim_key; }
      uint64_t index_by_name() const { return event_name.value; }
    };

    TABLE depostruct {
      uint64_t      prim_key;
      name          user;
      asset         deposit;
      uint64_t      timestamp;

      auto primary_key() const { return prim_key; }
      uint64_t index_by_user() const { return user.value; }
    };

    typedef eosio::multi_index<
        name("eventstruct"), eventstruct,
        indexed_by<name("byname"), const_mem_fun<eventstruct, uint64_t,
                                                 &eventstruct::index_by_name>>>
        event_table;
    typedef eosio::multi_index<
        name("depostruct"), depostruct,
        indexed_by<name("byuser"), const_mem_fun<depostruct, uint64_t,
                                                 &depostruct::index_by_user>>>
        deposit_table;

    event_table _events;
    bool is_event_exist(name event_name) {
      auto index = _events.get_index<name("byname")>();
      auto itr = index.find(event_name.value);
      return itr != index.end();
    }
    bool is_deposit_exist(deposit_table & deposits, name user) {
      auto index = deposits.get_index<name("byuser")>();
      auto itr = index.find(user.value);
      return itr != index.end();
    }

  public:
    using contract::contract;

    // constructor
    eventchain(name receiver, name code, datastream<const char *> ds)
        : contract(receiver, code, ds), _events(receiver, receiver.value) {}


    ACTION reward(name user, name owner, name event_name){
      require_auth(user);
      auto index = _events.get_index<name("byname")>();
      auto &event_entry = index.get(event_name.value);
      auto reward = event_entry.reward;
      action(permission_level{_self, name("active")}, name("eosio.token"),
             name("transfer"),
             std::make_tuple(_self, owner, reward,
                             string("Thank you for your data.")))
          .send();
      _events.erase(event_entry);
    }

    ACTION refund(name owner, name event_name) {
      eosio_assert(!is_event_exist(event_name), "can not refund while event ongoing");
      deposit_table deposits = deposit_table(_self, event_name.value);
      auto index = deposits.get_index<name("byuser")>();
      auto &deposit_entry = index.get(owner.value);
      action(permission_level{_self, name("active")}, name("eosio.token"),
             name("transfer"),
             std::make_tuple(_self, deposit_entry.user, deposit_entry.deposit,
                             string("refund.")))
          .send();
      deposits.erase(deposit_entry);
    }

    void data_owner_deposit(name user, name event_name, asset deposit) {
      eosio_assert(is_event_exist(event_name), "can not deposit to event end or not exist.");
      deposit_table deposits = deposit_table(_self, event_name.value);
      if (!is_deposit_exist(deposits, user)) {
        deposits.emplace(_self, [&](auto &item) {
          item.prim_key = deposits.available_primary_key();
          item.user = user;
          item.deposit = deposit;
          item.timestamp = now();
        });
      } else {
        auto index = deposits.get_index<name("byuser")>();
        auto &entry = index.get(event_name.value);
        deposits.modify(entry, _self, [&](auto &item) {
          item.deposit += deposit;
          item.timestamp = now();
        });
      }
    }

    void data_user_deposit(name user, name event_name, asset reward) {
      if (!is_event_exist(event_name)) {
        _events.emplace(_self, [&](auto &new_event) {
          new_event.prim_key = _events.available_primary_key();
          new_event.user = user;
          new_event.event_name = event_name;
          new_event.reward = reward;
          new_event.timestamp = now();
        });
      } else {
        auto index = _events.get_index<name("byname")>();
        auto &event_entry = index.get(event_name.value);
        _events.modify(event_entry, _self, [&](auto &modified_event) {
          modified_event.reward += reward;
          modified_event.timestamp = now();
        });
      }
    }

    struct transfer_struct {
      name from;
      name to;
      asset quantity;
      string memo;
    };

    void on_transfer(uint64_t sender, uint64_t receiver) {
      auto transfer_data = unpack_action_data<transfer_struct>();
      if (transfer_data.from == _self || transfer_data.to != _self) {
        return;
      }

      eosio_assert(transfer_data.quantity.is_valid(), "Invalid token transfer");
      eosio_assert(transfer_data.quantity.amount > 0, "Quantity must be positive");

      auto symbol = transfer_data.quantity.symbol;
      auto type = transfer_data.memo.substr(0, 1);
      auto event_name = transfer_data.memo.substr(1);
      if (type == "o") {
        data_owner_deposit(transfer_data.from, name(event_name),
                           transfer_data.quantity);
      } else if (type == "u") {
        data_user_deposit(transfer_data.from, name(event_name),
                          transfer_data.quantity);
      }
    }
};

// specify the contract name, and export a public action: update

extern "C" {
  void apply(uint64_t receiver, uint64_t code, uint64_t action) {
    if (code == receiver) {
      switch (action) {
        EOSIO_DISPATCH_HELPER(eventchain, (reward)(refund))
      }
    } else if (action == name("transfer").value && code == name("eosio.token").value) {
      execute_action(name(receiver), name(code), &eventchain::on_transfer);
    }
  }
};
