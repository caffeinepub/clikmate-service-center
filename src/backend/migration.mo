import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  // Old types (before the migration)
  type OldBusinessInfo = {
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    hours : Text;
  };

  type OldInquiry = {
    name : Text;
    phone : Text;
    message : Text;
  };

  type OldOrderRecord = {
    id : Nat;
    name : Text;
    phone : Text;
    serviceType : Text;
    instructions : Text;
    fileUrl : Text;
    status : Text;
    uploadedFiles : [Storage.ExternalBlob];
    submittedAt : Int;
  };

  type OldUserProfile = {
    name : Text;
    phone : Text;
    customerName : ?Text;
    deliveryAddress : ?Text;
  };

  type OldCatalogItem = {
    id : Nat;
    name : Text;
    category : Text;
    description : Text;
    price : Text;
    stockStatus : Text;
    published : Bool;
    mediaFiles : [Storage.ExternalBlob];
    mediaTypes : [Text];
    createdAt : Int;
  };

  type OldShopOrderItem = {
    itemId : Nat;
    itemName : Text;
    qty : Nat;
    price : Float;
  };

  type OldShopOrder = {
    id : Nat;
    phone : Text;
    customerName : Text;
    deliveryMethod : Text;
    deliveryAddress : Text;
    paymentMethod : Text;
    items : [OldShopOrderItem];
    totalAmount : Float;
    status : Text;
    createdAt : Int;
  };

  type OldUpiSettings = {
    upiId : Text;
    qrCodeUrl : Text;
  };

  type OldActor = {
    businessInfo : ?OldBusinessInfo;
    inquiries : Map.Map<Text, OldInquiry>;
    nextOrderId : Nat;
    orders : Map.Map<Nat, OldOrderRecord>;
    otpStore : Map.Map<Text, Text>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    nextCatalogId : Nat;
    catalogItems : Map.Map<Nat, OldCatalogItem>;
    nextShopOrderId : Nat;
    shopOrders : Map.Map<Nat, OldShopOrder>;
    upiSettings : ?OldUpiSettings;
    customerProfiles : Map.Map<Text, { customerName : Text; deliveryAddress : Text }>;
  };

  // New types (after the migration)
  type NewBusinessInfo = {
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    hours : Text;
  };

  type NewInquiry = {
    name : Text;
    phone : Text;
    message : Text;
  };

  type NewOrderRecord = {
    id : Nat;
    name : Text;
    phone : Text;
    serviceType : Text;
    instructions : Text;
    fileUrl : Text;
    status : Text;
    uploadedFiles : [Storage.ExternalBlob];
    submittedAt : Int;
  };

  type NewUserProfile = {
    name : Text;
    phone : Text;
    customerName : ?Text;
    deliveryAddress : ?Text;
  };

  type NewCatalogItem = {
    id : Nat;
    name : Text;
    category : Text;
    description : Text;
    price : Text;
    stockStatus : Text;
    published : Bool;
    mediaFiles : [Storage.ExternalBlob];
    mediaTypes : [Text];
    createdAt : Int;
  };

  type NewShopOrderItem = {
    itemId : Nat;
    itemName : Text;
    qty : Nat;
    price : Float;
  };

  type NewShopOrder = {
    id : Nat;
    phone : Text;
    customerName : Text;
    deliveryMethod : Text;
    deliveryAddress : Text;
    paymentMethod : Text;
    items : [NewShopOrderItem];
    totalAmount : Float;
    status : Text;
    createdAt : Int;
    deliveryOtp : Text;
  };

  type NewUpiSettings = {
    upiId : Text;
    qrCodeUrl : Text;
  };

  type NewActor = {
    businessInfo : ?NewBusinessInfo;
    inquiries : Map.Map<Text, NewInquiry>;
    nextOrderId : Nat;
    orders : Map.Map<Nat, NewOrderRecord>;
    otpStore : Map.Map<Text, Text>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    nextCatalogId : Nat;
    catalogItems : Map.Map<Nat, NewCatalogItem>;
    nextShopOrderId : Nat;
    shopOrders : Map.Map<Nat, NewShopOrder>;
    upiSettings : ?NewUpiSettings;
    customerProfiles : Map.Map<Text, { customerName : Text; deliveryAddress : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    let newShopOrders = old.shopOrders.map<Nat, OldShopOrder, NewShopOrder>(
      func(_id, oldOrder) {
        { oldOrder with deliveryOtp = "" };
      }
    );
    { old with shopOrders = newShopOrders };
  };
};
