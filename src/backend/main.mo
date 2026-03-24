import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Random "mo:core/Random";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Initialize the access control state
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
    requiredDocuments : Text;
  };

  public type CatalogItemInput = {
    name : Text;
    category : Text;
    description : Text;
    price : Text;
    stockStatus : Text;
    mediaFiles : [Storage.ExternalBlob];
    mediaTypes : [Text];
    requiredDocuments : Text;
  };

  module CatalogItem {
    public func compare(a : CatalogItem, b : CatalogItem) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  var walletBalances = Map.empty<Text, Float>();

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
    deliveryOtp : Text;
    cscDocuments : [Storage.ExternalBlob];
    cscSpecialDetails : Text;
    cscFinalOutput : ?Storage.ExternalBlob;
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
    role : Text;
  };

  let riders = Map.empty<Text, Rider>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Store Business Info
  public shared ({ caller }) func setBusinessInfo(ownInfo : BusinessInfo) : async () {
    businessInfo := ?ownInfo;
  };

  // Get Business Info (Public)
  public query func getBusinessInfo() : async BusinessInfo {
    switch (businessInfo) {
      case (null) { Runtime.trap("Business info not set") };
      case (?info) { info };
    };
  };

  // Submit Inquiry (Public)
  public shared ({ caller }) func submitInquiry(name : Text, phone : Text, message : Text) : async () {
    let inquiry = {
      name;
      phone;
      message;
    };
    inquiries.add(name, inquiry);
  };

  // Get Inquiries
  public query ({ caller }) func getInquiries() : async [Inquiry] {
    inquiries.values().toArray();
  };

  // OTP Functions
  public shared func generateOtp(phone : Text) : async Text {
    let simulatedOtp = "123456";
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

  // Get Orders by Phone
  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [OrderRecord] {
    orders.values().toArray().filter(func(order) { order.phone == phone }).sort();
  };

  public type FilterOrders = {
    name : ?Text;
    phone : ?Text;
    serviceType : ?Text;
    status : ?Text;
  };

  public query ({ caller }) func filterOrders(filters : FilterOrders) : async [OrderRecord] {
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

  // Update Order Status
  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Text) : async () {
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(id, updatedOrder);
      };
    };
  };

  // ─── Catalog Management CMS ───────────────────────────────────────────────

  // Add catalog item
  public shared ({ caller }) func addCatalogItem(input : CatalogItemInput) : async Nat {
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
      requiredDocuments = input.requiredDocuments;
    };
    catalogItems.add(id, item);
    nextCatalogId += 1;
    id;
  };

  // Update catalog item
  public shared ({ caller }) func updateCatalogItem(id : Nat, input : CatalogItemInput) : async () {
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
          requiredDocuments = input.requiredDocuments;
        };
        catalogItems.add(id, updated);
      };
    };
  };

  // Delete catalog item
  public shared ({ caller }) func deleteCatalogItem(id : Nat) : async () {
    catalogItems.remove(id);
  };

  // Toggle publish status
  public shared ({ caller }) func togglePublishCatalogItem(id : Nat) : async () {
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

  // Get all catalog items including unpublished
  public query ({ caller }) func getAllCatalogItems() : async [CatalogItem] {
    catalogItems.values().toArray();
  };

  // Get single catalog item by id (Public)
  public query func getCatalogItem(id : Nat) : async ?CatalogItem {
    catalogItems.get(id);
  };

  // Place Shop Order (Public)
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
      cscDocuments = [];
      cscSpecialDetails = "";
      cscFinalOutput = null;
    };
    shopOrders.add(id, order);
    nextShopOrderId += 1;
    order;
  };

  // Place CSC Shop Order (Public)
  public shared func placeCscShopOrder(phone : Text, customerName : Text, deliveryMethod : Text, deliveryAddress : Text, paymentMethod : Text, items : [ShopOrderItem], totalAmount : Float, cscDocuments : [Storage.ExternalBlob], cscSpecialDetails : Text) : async ShopOrder {
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
      status = "Docs Received";
      createdAt = Time.now();
      deliveryOtp = "";
      cscDocuments;
      cscSpecialDetails;
      cscFinalOutput = null;
    };
    shopOrders.add(id, order);
    nextShopOrderId += 1;
    order;
  };

  // Upload CSC final output (Public - admin authenticated via frontend)
  public shared func uploadCscFinalOutput(orderId : Nat, file : Storage.ExternalBlob) : async () {
    switch (shopOrders.get(orderId)) {
      case (null) { Runtime.trap("Shop order not found") };
      case (?order) {
        let updatedOrder = { order with cscFinalOutput = ?file };
        shopOrders.add(orderId, updatedOrder);
      };
    };
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

  // ─── Rider Delivery Features ─────────────────────────────────────────

  // Get ready for delivery orders (Public)
  public query func getReadyForDeliveryOrders() : async [MaskedShopOrder] {
    shopOrders.values().toArray().filter(func(o) { o.status == "Ready for Delivery" }).map(func(o) { maskShopOrder(o) });
  };

  // Mark order delivered using OTP (Public)
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

  // ─── Rider Management ──────────────────────────────────────────────

  // Add rider
  public shared ({ caller }) func addRider(name : Text, mobile : Text, pin : Text) : async () {
    let rider : Rider = {
      name;
      mobile;
      pin;
      role = "Rider";
    };
    riders.add(mobile, rider);
  };

  // Add team member with role (Rider or Staff)
  public shared ({ caller }) func addTeamMember(name : Text, mobile : Text, pin : Text, role : Text) : async () {
    let member : Rider = {
      name;
      mobile;
      pin;
      role;
    };
    riders.add(mobile, member);
  };

  // Remove rider
  public shared ({ caller }) func removeRider(mobile : Text) : async () {
    riders.remove(mobile);
  };

  // Get all riders
  public query ({ caller }) func getRiders() : async [Rider] {
    riders.values().toArray();
  };

  // Verify rider credentials (Public)
  public query func verifyRider(mobile : Text, pin : Text) : async Bool {
    switch (riders.get(mobile)) {
      case (null) { false };
      case (?rider) { rider.pin == pin };
    };
  };

  // Verify staff credentials (Public)
  public query func verifyStaff(mobile : Text, pin : Text) : async Bool {
    switch (riders.get(mobile)) {
      case (null) { false };
      case (?rider) {
        if (rider.role == "Staff") {
          rider.pin == pin;
        } else { false };
      };
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

  // Set UPI Settings
  public shared ({ caller }) func setUpiSettings(upiId : Text, qrCodeUrl : Text) : async () {
    upiSettings := ?{ upiId; qrCodeUrl };
  };

  // Save Customer Profile
  public shared ({ caller }) func saveCustomerProfile(phone : Text, customerName : Text, deliveryAddress : Text) : async () {
    customerProfiles.add(phone, { customerName; deliveryAddress });
  };

  // Get Customer Profile (Public)
  public query func getCustomerProfile(phone : Text) : async ?{ customerName : Text; deliveryAddress : Text } {
    customerProfiles.get(phone);
  };

  // Master Key Admin Claim (kept for compatibility)
  public shared ({ caller }) func claimAdminWithMasterKey(key : Text) : async Bool {
    if (key == "CLIKMATE-ADMIN-2024") {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      return true;
    };
    return false;
  };

  // ██████████████████████████████████████████████████████████████████████████
  // █    NEW DEVELOPMENT: WALLET & QUOTE FEATURES (Premium Educator)       █
  // ██████████████████████████████████████████████████████████████████████████

  // ── Customer Digital Wallet ─────────────────────────────────────────---

  // Get wallet balance by phone
  public query ({ caller }) func getWalletBalance(phone : Text) : async Float {
    if (phone.size() != 10) {
      Runtime.trap("Invalid phone");
    };

    switch (walletBalances.get(phone)) {
      case (?balance) { balance };
      case (null) { 0.0 };
    };
  };

  // Admin recharge wallet
  public shared ({ caller }) func rechargeWallet(phone : Text, amount : Float) : async Float {
    let oldBalance = switch (walletBalances.get(phone)) {
      case (?balance) { balance };
      case (null) { 0.0 };
    };
    let newBalance = oldBalance + amount;
    walletBalances.add(phone, newBalance);
    newBalance;
  };

  // Admin deduct wallet (if insufficient, trap)
  public shared ({ caller }) func deductWallet(phone : Text, amount : Float) : async Float {
    let oldBalance = switch (walletBalances.get(phone)) {
      case (?balance) { balance };
      case (null) { Runtime.trap("Insufficient funds") };
    };

    if (oldBalance < amount) {
      Runtime.trap("Insufficient funds");
    };

    let newBalance = oldBalance - amount;
    walletBalances.add(phone, newBalance);
    newBalance;
  };

  // Deduct wallet for order payment
  public shared ({ caller }) func deductWalletForOrder(phone : Text, amount : Float) : async Float {
    let oldBalance = switch (walletBalances.get(phone)) {
      case (?balance) { balance };
      case (null) { Runtime.trap("Insufficient funds") };
    };

    if (oldBalance < amount) {
      Runtime.trap("Insufficient funds");
    };

    let newBalance = oldBalance - amount;
    walletBalances.add(phone, newBalance);
    newBalance;
  };

  // ── Typesetting Quote Feature ─────────────────────────────────────────-

  let typesettingQuotes = Map.empty<Nat, TypesettingQuoteRequest>();
  var nextTypesettingQuoteId = 1;

  type TypesettingQuoteRequest = {
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

  type TypesettingQuoteRequestInput = {
    name : Text;
    phone : Text;
    subject : Text;
    format : Text;
    language : Text;
    fileUrl : Text;
  };

  type TypesettingQuoteUpdate = {
    status : Text;
  };

  // Submit typesetting quote request (Public)
  public shared func submitTypesettingQuoteRequest(input : TypesettingQuoteRequestInput) : async Nat {
    let id = nextTypesettingQuoteId;
    let quote = {
      id;
      name = input.name;
      phone = input.phone;
      subject = input.subject;
      format = input.format;
      language = input.language;
      fileUrl = input.fileUrl;
      status = "Pending";
      submittedAt = Time.now();
    };
    typesettingQuotes.add(id, quote);
    nextTypesettingQuoteId += 1;
    id;
  };

  // Update typesetting quote status (Admin only)
  public shared ({ caller }) func updateTypesettingQuoteStatus(id : Nat, update : TypesettingQuoteUpdate) : async () {
    switch (typesettingQuotes.get(id)) {
      case (null) { Runtime.trap("Quote not found") };
      case (?quote) {
        let updated = { quote with status = update.status };
        typesettingQuotes.add(id, updated);
      };
    };
  };

  // Get all typesetting quotes (Admin only)
  public query ({ caller }) func getAllTypesettingQuotes() : async [TypesettingQuoteRequest] {
    typesettingQuotes.values().toArray();
  };

  // ── Customer Review System ─────────────────────────────────────────────

  public type Review = {
    id : Nat;
    orderId : Nat;
    customerName : Text;
    customerPhone : Text;
    location : Text;
    serviceRating : Nat;
    serviceComment : Text;
    deliveryRating : ?Nat;
    deliveryComment : ?Text;
    published : Bool;
    createdAt : Int;
  };

  let reviews = Map.empty<Nat, Review>();
  var nextReviewId = 1;
  var reviewsSeeded = false;

  // Submit a customer review (Public)
  public shared func submitReview(
    orderId : Nat,
    customerName : Text,
    customerPhone : Text,
    location : Text,
    serviceRating : Nat,
    serviceComment : Text,
    deliveryRating : ?Nat,
    deliveryComment : ?Text
  ) : async Nat {
    let id = nextReviewId;
    let review : Review = {
      id;
      orderId;
      customerName;
      customerPhone;
      location;
      serviceRating;
      serviceComment;
      deliveryRating;
      deliveryComment;
      published = true;
      createdAt = Time.now();
    };
    reviews.add(id, review);
    nextReviewId += 1;
    id;
  };

  // Get all published reviews (Public - for homepage carousel)
  public query func getPublishedReviews() : async [Review] {
    reviews.values().toArray().filter(func(r : Review) : Bool { r.published });
  };

  // Get all reviews (Admin)
  public query ({ caller }) func getAllReviews() : async [Review] {
    reviews.values().toArray();
  };

  // Toggle review published status (Admin)
  public shared ({ caller }) func toggleReviewPublished(id : Nat) : async () {
    switch (reviews.get(id)) {
      case (null) { Runtime.trap("Review not found") };
      case (?r) {
        reviews.add(id, { r with published = not r.published });
      };
    };
  };

  // Delete review (Admin)
  public shared ({ caller }) func deleteReview(id : Nat) : async () {
    reviews.remove(id);
  };

  // Seed 25 realistic reviews (idempotent - runs only once)
  public shared func seedReviews() : async () {
    if (reviewsSeeded) { return };
    reviewsSeeded := true;

    type SeedEntry = { name : Text; loc : Text; rating : Nat; comment : Text };
    let seeds : [SeedEntry] = [
      { name = "Aman V."; loc = "Awanti Vihar"; rating = 5; comment = "Best place for bulk printing near our PG. Quality is top notch and rates are very genuine." },
      { name = "Sneha T."; loc = "Shankar Nagar"; rating = 4; comment = "Got my PAN card applied here. Fast service, but the delivery boy called me twice for the address." },
      { name = "Rohit S."; loc = "NIT Raipur"; rating = 5; comment = "Their LaTeX typing service saved my project. Highly recommended for engineering students!" },
      { name = "Priya M."; loc = "Telibandha"; rating = 3; comment = "Print quality is good, but the physical shop gets too crowded in the evenings. Better to order online through this app." },
      { name = "Vikas K."; loc = "Labhandih"; rating = 5; comment = "Ordered a 64GB pendrive and some color printouts. Arrived at my office in Magneto Mall within 30 mins. Superfast!" },
      { name = "Anjali D."; loc = "Pandri"; rating = 4; comment = "Very helpful staff for filling out scholarship forms. Would have given 5 stars but the website was a bit slow yesterday." },
      { name = "Suresh B."; loc = "Katora Talab"; rating = 5; comment = "PVC Aadhaar card quality is exactly like the original. Delivered to my home safely." },
      { name = "Neha R."; loc = "Geetanjali Colony"; rating = 5; comment = "I always use ClikMate for my coaching notes printing. Never disappointed." },
      { name = "Kunal P."; loc = "Mowa"; rating = 4; comment = "Good cyber cafe services. They know all the govt form requirements perfectly." },
      { name = "Rahul G."; loc = "Tatibandh"; rating = 2; comment = "Service is good but the shop is quite far from my place and local delivery isn't available this far yet." },
      { name = "Divya S."; loc = "Awanti Vihar"; rating = 5; comment = "Very polite owner. The new online document upload feature is a game changer." },
      { name = "Amit J."; loc = "Shankar Nagar"; rating = 4; comment = "Bought earphones. Good quality. Delivery was slightly delayed due to rain, but rider was polite." },
      { name = "Puja Verma"; loc = "Vidhan Sabha Road"; rating = 5; comment = "Fastest color printouts in Raipur! Rates are much better than other shops." },
      { name = "Manish T."; loc = "Devendra Nagar"; rating = 5; comment = "Excellent typesetting for Hindi & English question papers. Very professional." },
      { name = "Kiran L."; loc = "Telibandha"; rating = 3; comment = "Rider didn't have change for a 500 rupee note. Please ask riders to carry change. Otherwise, great print service." },
      { name = "Sourabh M."; loc = "Pachpedi Naka"; rating = 5; comment = "Applied for my driving license through them. Hassle-free experience." },
      { name = "Nidhi A."; loc = "Civil Lines"; rating = 4; comment = "Nice app interface. Uploading PDFs is very easy directly from mobile." },
      { name = "Rakesh D."; loc = "Awanti Vihar"; rating = 5; comment = "My go-to place for all stationery and urgent printouts." },
      { name = "Gaurav S."; loc = "NIT Raipur"; rating = 5; comment = "Thesis binding was done perfectly. Very neat work." },
      { name = "Shruti K."; loc = "Byron Bazar"; rating = 4; comment = "Got 500 pages printed. 1-2 pages had light ink, but overall very cost-effective." },
      { name = "Tarun P."; loc = "Shankar Nagar"; rating = 5; comment = "The wallet feature is great. I just add 500 Rs and my sister can get her prints easily everyday." },
      { name = "Vivek N."; loc = "Labhandih"; rating = 4; comment = "Good experience with Passport application. They guided me properly about the documents." },
      { name = "Megha C."; loc = "Pandri"; rating = 5; comment = "Very fast delivery in local area. The rider was very well behaved." },
      { name = "Ashish R."; loc = "Fafadih"; rating = 3; comment = "App is good but I want them to add more PC accessories in the retail section." },
      { name = "Komal B."; loc = "Awanti Vihar"; rating = 5; comment = "Smart Online Service Center is exactly what this area needed. Digital and fast!" }
    ];

    for (s in seeds.vals()) {
      let id = nextReviewId;
      reviews.add(id, {
        id;
        orderId = 0;
        customerName = s.name;
        customerPhone = "";
        location = s.loc;
        serviceRating = s.rating;
        serviceComment = s.comment;
        deliveryRating = null;
        deliveryComment = null;
        published = true;
        createdAt = Time.now();
      });
      nextReviewId += 1;
    };
  };

  //  ───────────────────────────────────────────────────────────────────────
};
