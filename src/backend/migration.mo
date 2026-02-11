import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";

module {
  type OldUserProfile = {
    name : Text;
  };

  type OldActor = {
    userProfiles : OrderedMap.Map<Principal, OldUserProfile>;
  };

  type NewUserProfile = {
    name : Text;
    email : ?Text;
    bio : ?Text;
  };

  type NewActor = {
    userProfiles : OrderedMap.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    let userProfiles = principalMap.map<OldUserProfile, NewUserProfile>(
      old.userProfiles,
      func(_principal, oldProfile) {
        {
          name = oldProfile.name;
          email = null;
          bio = null;
        };
      },
    );
    { userProfiles };
  };
};
