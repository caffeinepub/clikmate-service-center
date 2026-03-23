import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Char "mo:core/Char";
import Random "mo:core/Random";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
 // import migration module


actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // Types and Modules
  type BusinessInfo = {
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    hours : Text;
  };

  type Inquiry = {
    name : Text;
    phone : Text;
    message : Text;
  };

  module Inquiry {
    public func compare(inquiry1 : Inquiry, inquiry2 : Inquiry) : Order.Order {
      Text.compare(inquiry1.name, inquiry2.name);
    };
  };

  type OrderRecord = {
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

  module OrderRecord {
    public func compare(a : OrderRecord, b : OrderRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type ServiceOrder = {
    name : Text;
    phone : Text;
    serviceType : Text;
    instructions : Text;
    files : [Storage.ExternalBlob];
  };

  public type UserProfile = {
    name : Text;
    phone : Text;
    customerName : ?Text;
    deliveryAddress : ?Text;
  };

  // Catalog Item type for CMS
  public type CatalogItem = {
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

  public type CatalogItemInput = {
    name : Text;
    category : Text;
    description : Text;
    price : Text;
    stockStatus : Text;
    mediaFiles : [Storage.ExternalBlob];
    mediaTypes : [Text];
  };

  module CatalogItem {
    public func compare(a : CatalogItem, b : CatalogItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // Store Business Info
  var businessInfo : ?BusinessInfo = null;

  // Store Inquiries
  let inquiries = Map.empty<Text, Inquiry>();

  // Store Orders
  var nextOrderId = 1;
  let orders = Map.empty<Nat, OrderRecord>();

  // OTP Store (phone -> OTP)
  let otpStore = Map.empty<Text, Text>();

  // User Profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Catalog Store
  var nextCatalogId = 1;
  let catalogItems = Map.empty<Nat, CatalogItem>();

  // Shop Orders
  public type ShopOrderItem = {
    itemId : Nat;
    itemName : Text;
    qty : Nat;
    price : Float;
  };

  public type ShopOrder = {
    id : Nat;
    phone : Text;
    customerName : Text;
    deliveryMethod : Text;
    deliveryAddress : Text;
    paymentMethod : Text;
    items : [ShopOrderItem];
    totalAmount : Float;
    status : Text;
    createdAt : Int;
    deliveryOtp : Text; // field added
  };

  // Masked order type for public visibility.
  public type MaskedShopOrder = {
    id : Nat;
    phone : Text;
    customerName : Text;
    deliveryMethod : Text;
    deliveryAddress : Text;
    paymentMethod : Text;
    items : [ShopOrderItem];
    totalAmount : Float;
    status : Text;
    createdAt : Int;
  };

  public type UpiSettings = {
    upiId : Text;
    qrCodeUrl : Text;
  };

  var nextShopOrderId = 1001;
  let shopOrders = Map.empty<Nat, ShopOrder>();
  var upiSettings : ?UpiSettings = null;

  // Customer profiles (phone -> {customerName, deliveryAddress})
  let customerProfiles = Map.empty<Text, { customerName : Text; deliveryAddress : Text }>();

  // Rider type and store
  public type Rider = {
    name : Text;
    mobile : Text;
    pin : Text;
  };

  let riders = Map.empty<Text, Rider>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Store Business Info (Admin only)
  public shared ({ caller }) func setBusinessInfo(ownInfo : BusinessInfo) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set business info");
    };
    businessInfo := ?ownInfo;
  };

  // Get Business Info (Public - no auth needed)
  public query func getBusinessInfo() : async BusinessInfo {
    switch (businessInfo) {
      case (null) { Runtime.trap("Business info not set") };
      case (?info) { info };
    };
  };

  // Submit Inquiry (Public - no auth needed, guests can submit)
  public shared func submitInquiry(name : Text, phone : Text, message : Text) : async () {
    let inquiry = {
      name;
      phone;
      message;
    };
    inquiries.add(name, inquiry);
  };

  // Get Inquiries (Admin only)
  public query ({ caller }) func getInquiries() : async [Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view inquiries");
    };
    inquiries.values().toArray();
  };

  // OTP Functions (Public - no auth needed, guests can use)
  public shared func generateOtp(phone : Text) : async Text {
    // Simulate 6-digit OTP
    let simulatedOtp = "123456"; // Replace with real random generation in prod
    otpStore.add(phone, simulatedOtp);
    simulatedOtp;
  };

  public shared func verifyOtp(phone : Text, code : Text) : async Bool {
    switch (otpStore.get(phone)) {
      case (?storedCode) {
        if (storedCode == code) {
          otpStore.remove(phone);
          true;
        } else { false };
      };
      case (null) { false };
    };
  };

  // Document Order Functions
  // Submit Order (Public - no auth needed, guests can submit)
  public shared func submitOrder(name : Text, phone : Text, serviceType : Text, instructions : Text, fileUrl : Text) : async Nat {
    let id = nextOrderId;
    let order : OrderRecord = {
      id;
      name;
      phone;
      serviceType;
      instructions;
      fileUrl;
      status = "Pending";
      uploadedFiles = [];
      submittedAt = Time.now();
    };
    orders.add(id, order);
    nextOrderId += 1;
    id;
  };

  public shared func submitOrderFull(input : ServiceOrder) : async Nat {
    let id = nextOrderId;
    let order : OrderRecord = {
      id;
      name = input.name;
      phone = input.phone;
      serviceType = input.serviceType;
      instructions = input.instructions;
      fileUrl = "";
      status = "Pending";
      uploadedFiles = input.files;
      submittedAt = Time.now();
    };
    orders.add(id, order);
    nextOrderId += 1;
    id;
  };

  // Get Orders by Phone (Ownership verification required)
  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [OrderRecord] {
    // Admins can view any orders
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return orders.values().toArray().filter(func(order) { order.phone == phone }).sort();
    };

    // Users must be authenticated and can only view orders matching their profile phone
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };

    // Verify the phone matches the caller's profile
    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.phone != phone) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        orders.values().toArray().filter(func(order) { order.phone == phone }).sort();
      };
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
    };
  };

  public type FilterOrders = {
    name : ?Text;
    phone : ?Text;
    serviceType : ?Text;
    status : ?Text;
  };

  public query ({ caller }) func filterOrders(filters : FilterOrders) : async [OrderRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can filter orders");
    };

    var filtered = orders.values().toArray();

    switch (filters.name) {
      case (?name) {
        filtered := filtered.filter(func(order) { order.name.contains(#text(name)) });
      };
      case (null) {};
    };

    switch (filters.phone) {
      case (?phone) {
        filtered := filtered.filter(func(order) { order.phone.contains(#text(phone)) });
      };
      case (null) {};
    };

    switch (filters.serviceType) {
      case (?serviceType) {
        filtered := filtered.filter(func(order) { order.serviceType.contains(#text(serviceType)) });
      };
      case (null) {};
    };

    switch (filters.status) {
      case (?status) {
        filtered := filtered.filter(func(order) { order.status.contains(#text(status)) });
      };
      case (null) {};
    };

    filtered;
  };

  // Update Order Status (Admin only)
  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(id, updatedOrder);
      };
    };
  };

  // ─── Catalog Management CMS ───────────────────────────────────────────────

  // Add catalog item (Admin only)
  public shared ({ caller }) func addCatalogItem(input : CatalogItemInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add catalog items");
    };
    let id = nextCatalogId;
    let item : CatalogItem = {
      id;
      name = input.name;
      category = input.category;
      description = input.description;
      price = input.price;
      stockStatus = input.stockStatus;
      published = true;
      mediaFiles = input.mediaFiles;
      mediaTypes = input.mediaTypes;
      createdAt = Time.now();
    };
    catalogItems.add(id, item);
    nextCatalogId += 1;
    id;
  };

  // Update catalog item (Admin only)
  public shared ({ caller }) func updateCatalogItem(id : Nat, input : CatalogItemInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update catalog items");
    };
    switch (catalogItems.get(id)) {
      case (null) { Runtime.trap("Catalog item not found") };
      case (?existing) {
        let updated : CatalogItem = {
          existing with
          name = input.name;
          category = input.category;
          description = input.description;
          price = input.price;
          stockStatus = input.stockStatus;
          mediaFiles = input.mediaFiles;
          mediaTypes = input.mediaTypes;
        };
        catalogItems.add(id, updated);
      };
    };
  };

  // Delete catalog item (Admin only)
  public shared ({ caller }) func deleteCatalogItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete catalog items");
    };
    catalogItems.remove(id);
  };

  // Toggle publish status (Admin only)
  public shared ({ caller }) func togglePublishCatalogItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can toggle catalog item visibility");
    };
    switch (catalogItems.get(id)) {
      case (null) { Runtime.trap("Catalog item not found") };
      case (?item) {
        let updated = { item with published = not item.published };
        catalogItems.add(id, updated);
      };
    };
  };

  // Get all published catalog items (Public)
  public query func getPublishedCatalogItems() : async [CatalogItem] {
    catalogItems.values().toArray().filter(func(item) { item.published });
  };

  // Get all catalog items including unpublished (Admin only)
  public query ({ caller }) func getAllCatalogItems() : async [CatalogItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all catalog items");
    };
    catalogItems.values().toArray();
  };

  // Get single catalog item by id (Public)
  public query func getCatalogItem(id : Nat) : async ?CatalogItem {
    catalogItems.get(id);
  };

  // Place Shop Order (Public - guests can place orders)
  public shared func placeShopOrder(phone : Text, customerName : Text, deliveryMethod : Text, deliveryAddress : Text, paymentMethod : Text, items : [ShopOrderItem], totalAmount : Float) : async ShopOrder {
    let id = nextShopOrderId;
    let order : ShopOrder = {
      id;
      phone;
      customerName;
      deliveryMethod;
      deliveryAddress;
      paymentMethod;
      items;
      totalAmount;
      status = "Pending";
      createdAt = Time.now();
      deliveryOtp = "";
    };
    shopOrders.add(id, order);
    nextShopOrderId += 1;
    order;
  };

  // Get Shop Orders by Phone (Ownership verification required)
  public query ({ caller }) func getMyShopOrders(phone : Text) : async [ShopOrder] {
    // Admins can view any shop orders
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return shopOrders.values().toArray().filter(func(order) { order.phone == phone });
    };

    // Users must be authenticated and can only view orders matching their profile phone
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view shop orders");
    };

    // Verify the phone matches the caller's profile
    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.phone != phone) {
          Runtime.trap("Unauthorized: Can only view your own shop orders");
        };
        shopOrders.values().toArray().filter(func(order) { order.phone == phone });
      };
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
    };
  };

  // Get All Shop Orders (Admin only)
  public query ({ caller }) func getAllShopOrders() : async [ShopOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all shop orders");
    };
    shopOrders.values().toArray();
  };

  // Update Shop Order Status (Admin only)
  public shared ({ caller }) func updateShopOrderStatus(orderId : Nat, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update shop order status");
    };
    switch (shopOrders.get(orderId)) {
      case (null) { Runtime.trap("Shop order not found") };
      case (?order) {
        if (status == "Ready for Delivery" and order.deliveryOtp == "") {
          let newOtp = await generateRandomOtp();
          let updatedOrder = { order with status; deliveryOtp = newOtp };
          shopOrders.add(orderId, updatedOrder);
        } else {
          let updatedOrder = { order with status };
          shopOrders.add(orderId, updatedOrder);
        };
      };
    };
  };

  // Place Shop Order (Public - guests can place orders)
  public shared ({ caller }) func placeShopOrderWithOTP(phone : Text, customerName : Text, deliveryMethod : Text, deliveryAddress : Text, paymentMethod : Text, items : [ShopOrderItem], totalAmount : Float) : async ShopOrder {
    let id = nextShopOrderId;
    let order : ShopOrder = {
      id;
      phone;
      customerName;
      deliveryMethod;
      deliveryAddress;
      paymentMethod;
      items;
      totalAmount;
      status = "Pending";
      createdAt = Time.now();
      deliveryOtp = "";
    };
    shopOrders.add(id, order);
    nextShopOrderId += 1;
    order;
  };

  func maskShopOrder(order : ShopOrder) : MaskedShopOrder {
    {
      id = order.id;
      phone = order.phone;
      customerName = order.customerName;
      deliveryMethod = order.deliveryMethod;
      deliveryAddress = order.deliveryAddress;
      paymentMethod = order.paymentMethod;
      items = order.items;
      totalAmount = order.totalAmount;
      status = order.status;
      createdAt = order.createdAt;
    };
  };

  // ─── New Rider Delivery Features ─────────────────────────────────────────

  // Public get ready for delivery orders
  public query func getReadyForDeliveryOrders() : async [MaskedShopOrder] {
    shopOrders.values().toArray().filter(func(o) { o.status == "Ready for Delivery" }).map(func(o) { maskShopOrder(o) });
  };

  // Public mark order delivered using OTP
  public shared func markOrderDelivered(orderId : Nat, otp : Text) : async ShopOrder {
    switch (shopOrders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.status != "Ready for Delivery") {
          Runtime.trap("Order not ready for delivery");
        };
        if (order.deliveryOtp != otp) {
          Runtime.trap("Invalid OTP");
        };
        let updatedOrder = { order with status = "Delivered" };
        shopOrders.add(orderId, updatedOrder);
        updatedOrder;
      };
    };
  };

  // ─── Rider Management (Admin only methods) ──────────────────────────────

  // Admin only - Add rider
  public shared ({ caller }) func addRider(name : Text, mobile : Text, pin : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add riders");
    };
    let rider : Rider = {
      name;
      mobile;
      pin;
    };
    riders.add(mobile, rider);
  };

  // Admin only - Remove rider
  public shared ({ caller }) func removeRider(mobile : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove riders");
    };
    riders.remove(mobile);
  };

  // Admin only - Get all riders
  public query ({ caller }) func getRiders() : async [Rider] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view riders");
    };
    riders.values().toArray();
  };

  // Public - Verify rider credentials (mobile + pin)
  public query func verifyRider(mobile : Text, pin : Text) : async Bool {
    switch (riders.get(mobile)) {
      case (null) { false };
      case (?rider) { rider.pin == pin };
    };
  };

  // Helper function to generate a 4-digit OTP as Text
  func generateRandomOtp() : async Text {
    (await Random.natRange(1000, 10000)).toText();
  };

  // Get UPI Settings (Public)
  public query func getUpiSettings() : async ?UpiSettings {
    upiSettings;
  };

  // Set UPI Settings (Admin only)
  public shared ({ caller }) func setUpiSettings(upiId : Text, qrCodeUrl : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set UPI settings");
    };
    upiSettings := ?{ upiId; qrCodeUrl };
  };

  // Save Customer Profile (Ownership verification required)
  public shared ({ caller }) func saveCustomerProfile(phone : Text, customerName : Text, deliveryAddress : Text) : async () {
    // Admins can save any customer profile
    if (AccessControl.isAdmin(accessControlState, caller)) {
      customerProfiles.add(phone, { customerName; deliveryAddress });
      return;
    };

    // Users must be authenticated and can only save their own profile
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save customer profiles");
    };

    // Verify the phone matches the caller's profile
    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.phone != phone) {
          Runtime.trap("Unauthorized: Can only save your own customer profile");
        };
        customerProfiles.add(phone, { customerName; deliveryAddress });
      };
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
    };
  };

  // Get Customer Profile (Public)
  public query func getCustomerProfile(phone : Text) : async ?{ customerName : Text; deliveryAddress : Text } {
    customerProfiles.get(phone);
  };

  // Master Key Admin Claim (Emergency fallback for owner lockout - always works)
  public shared ({ caller }) func claimAdminWithMasterKey(key : Text) : async Bool {
    if (key == "CLIKMATE-ADMIN-2024") {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      return true;
    };
    return false;
  };

};
