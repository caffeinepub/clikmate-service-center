import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

module {
  public type OldRider = {
    name : Text;
    mobile : Text;
    pin : Text;
    role : Text;
  };

  public type OldActor = {
    riders : Map.Map<Text, OldRider>;
    riderActiveStatus : Map.Map<Text, Bool>;
    // ... other actor fields
  };

  public type NewRider = {
    name : Text;
    mobile : Text;
    pin : Text;
    role : Text;
    baseSalary : Float;
  };

  public type NewActor = {
    riders : Map.Map<Text, NewRider>;
    riderActiveStatus : Map.Map<Text, Bool>;
    // ... other actor fields
  };

  public func run(old : OldActor) : NewActor {
    let newRiders = old.riders.map<Text, OldRider, NewRider>(
      func(_mobile, oldRider) {
        { oldRider with baseSalary = 0.0 };
      },
    );
    { old with riders = newRiders };
  };
};
