import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  // Old typesetting quote request (old actor state)
  type OldTypesettingQuoteRequest = {
    id : Nat;
    name : Text;
    phone : Text;
    subject : Text;
    format : Text;
    language : Text;
    fileUrl : Text;
    status : Text;
    submittedAt : Int;
  };

  // Old actor type
  type OldActor = {
    typesettingQuotes : Map.Map<Nat, OldTypesettingQuoteRequest>;
  };

  // New types with extended fields
  type NewTypesettingQuoteRequest = {
    id : Nat;
    name : Text;
    phone : Text;
    subject : Text;
    format : Text;
    language : Text;
    fileUrl : Text;
    status : Text;
    submittedAt : Int;
    finalPdfUrl : Text;
    quoteNotes : Text;
  };

  // New actor type
  type NewActor = {
    typesettingQuotes : Map.Map<Nat, NewTypesettingQuoteRequest>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newTypesettingQuotes = old.typesettingQuotes.map<Nat, OldTypesettingQuoteRequest, NewTypesettingQuoteRequest>(
      func(_id, oldQuote) {
        {
          oldQuote with
          finalPdfUrl = "";
          quoteNotes = "";
        };
      }
    );
    { typesettingQuotes = newTypesettingQuotes };
  };
};
