import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UpiSettings {
    upiId: string;
    qrCodeUrl: string;
}
export interface CatalogItemInput {
    requiredDocuments: string;
    stockStatus: string;
    name: string;
    description: string;
    category: string;
    price: string;
    mediaFiles: Array<ExternalBlob>;
    mediaTypes: Array<string>;
}
export interface MaskedShopOrder {
    id: bigint;
    customerName: string;
    status: string;
    deliveryAddress: string;
    paymentMethod: string;
    createdAt: bigint;
    deliveryMethod: string;
    totalAmount: number;
    phone: string;
    items: Array<ShopOrderItem>;
}
export interface ShopOrder {
    id: bigint;
    customerName: string;
    status: string;
    deliveryAddress: string;
    paymentMethod: string;
    deliveryOtp: string;
    cscFinalOutput?: ExternalBlob;
    createdAt: bigint;
    deliveryMethod: string;
    cscDocuments: Array<ExternalBlob>;
    cscSpecialDetails: string;
    totalAmount: number;
    phone: string;
    items: Array<ShopOrderItem>;
}
export interface OrderRecord {
    id: bigint;
    status: string;
    serviceType: string;
    name: string;
    submittedAt: bigint;
    instructions: string;
    uploadedFiles: Array<ExternalBlob>;
    phone: string;
    fileUrl: string;
}
export interface TypesettingQuoteUpdate {
    status: string;
}
export interface Rider {
    pin: string;
    name: string;
    role: string;
    mobile: string;
}
export interface FilterOrders {
    status?: string;
    serviceType?: string;
    name?: string;
    phone?: string;
}
export interface TypesettingQuoteRequestInput {
    subject: string;
    name: string;
    language: string;
    phone: string;
    format: string;
    fileUrl: string;
}
export interface ServiceOrder {
    files: Array<ExternalBlob>;
    serviceType: string;
    name: string;
    instructions: string;
    phone: string;
}
export interface TypesettingQuoteRequest {
    id: bigint;
    status: string;
    subject: string;
    name: string;
    submittedAt: bigint;
    language: string;
    phone: string;
    format: string;
    fileUrl: string;
}
export interface BusinessInfo {
    hours: string;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface ShopOrderItem {
    qty: bigint;
    itemId: bigint;
    itemName: string;
    price: number;
}
export interface Inquiry {
    name: string;
    message: string;
    phone: string;
}
export interface CatalogItem {
    id: bigint;
    requiredDocuments: string;
    stockStatus: string;
    published: boolean;
    name: string;
    createdAt: bigint;
    description: string;
    category: string;
    price: string;
    mediaFiles: Array<ExternalBlob>;
    mediaTypes: Array<string>;
}
export interface UserProfile {
    customerName?: string;
    deliveryAddress?: string;
    name: string;
    phone: string;
}
export interface Review {
    id: bigint;
    orderId: bigint;
    customerName: string;
    customerPhone: string;
    location: string;
    serviceRating: bigint;
    serviceComment: string;
    deliveryRating?: bigint;
    deliveryComment?: string;
    published: boolean;
    createdAt: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCatalogItem(input: CatalogItemInput): Promise<bigint>;
    addRider(name: string, mobile: string, pin: string): Promise<void>;
    addTeamMember(name: string, mobile: string, pin: string, role: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimAdminWithMasterKey(key: string): Promise<boolean>;
    deductWallet(phone: string, amount: number): Promise<number>;
    deductWalletForOrder(phone: string, amount: number): Promise<number>;
    deleteCatalogItem(id: bigint): Promise<void>;
    deleteReview(id: bigint): Promise<void>;
    filterOrders(filters: FilterOrders): Promise<Array<OrderRecord>>;
    generateOtp(phone: string): Promise<string>;
    getAllCatalogItems(): Promise<Array<CatalogItem>>;
    getAllReviews(): Promise<Array<Review>>;
    getAllTypesettingQuotes(): Promise<Array<TypesettingQuoteRequest>>;
    getBusinessInfo(): Promise<BusinessInfo>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCatalogItem(id: bigint): Promise<CatalogItem | null>;
    getCustomerProfile(phone: string): Promise<{
        customerName: string;
        deliveryAddress: string;
    } | null>;
    getInquiries(): Promise<Array<Inquiry>>;
    getOrdersByPhone(phone: string): Promise<Array<OrderRecord>>;
    getPublishedCatalogItems(): Promise<Array<CatalogItem>>;
    getPublishedReviews(): Promise<Array<Review>>;
    getReadyForDeliveryOrders(): Promise<Array<MaskedShopOrder>>;
    getRiders(): Promise<Array<Rider>>;
    getUpiSettings(): Promise<UpiSettings | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletBalance(phone: string): Promise<number>;
    isCallerAdmin(): Promise<boolean>;
    markOrderDelivered(orderId: bigint, otp: string): Promise<ShopOrder>;
    placeCscShopOrder(phone: string, customerName: string, deliveryMethod: string, deliveryAddress: string, paymentMethod: string, items: Array<ShopOrderItem>, totalAmount: number, cscDocuments: Array<ExternalBlob>, cscSpecialDetails: string): Promise<ShopOrder>;
    placeShopOrder(phone: string, customerName: string, deliveryMethod: string, deliveryAddress: string, paymentMethod: string, items: Array<ShopOrderItem>, totalAmount: number): Promise<ShopOrder>;
    rechargeWallet(phone: string, amount: number): Promise<number>;
    removeRider(mobile: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCustomerProfile(phone: string, customerName: string, deliveryAddress: string): Promise<void>;
    seedReviews(): Promise<void>;
    setBusinessInfo(ownInfo: BusinessInfo): Promise<void>;
    setUpiSettings(upiId: string, qrCodeUrl: string): Promise<void>;
    submitInquiry(name: string, phone: string, message: string): Promise<void>;
    submitOrder(name: string, phone: string, serviceType: string, instructions: string, fileUrl: string): Promise<bigint>;
    submitOrderFull(input: ServiceOrder): Promise<bigint>;
    submitReview(orderId: bigint, customerName: string, customerPhone: string, location: string, serviceRating: bigint, serviceComment: string, deliveryRating: bigint | null, deliveryComment: string | null): Promise<bigint>;
    submitTypesettingQuoteRequest(input: TypesettingQuoteRequestInput): Promise<bigint>;
    togglePublishCatalogItem(id: bigint): Promise<void>;
    toggleReviewPublished(id: bigint): Promise<void>;
    updateCatalogItem(id: bigint, input: CatalogItemInput): Promise<void>;
    updateOrderStatus(id: bigint, status: string): Promise<void>;
    updateTypesettingQuoteStatus(id: bigint, update: TypesettingQuoteUpdate): Promise<void>;
    uploadCscFinalOutput(orderId: bigint, file: ExternalBlob): Promise<void>;
    verifyOtp(phone: string, code: string): Promise<boolean>;
    verifyRider(mobile: string, pin: string): Promise<boolean>;
    verifyStaff(mobile: string, pin: string): Promise<boolean>;
}
