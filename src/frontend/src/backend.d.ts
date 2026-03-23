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
export interface UserProfile {
    customerName?: string;
    deliveryAddress?: string;
    name: string;
    phone: string;
}
export interface UpiSettings {
    upiId: string;
    qrCodeUrl: string;
}
export interface ShopOrder {
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
export interface FilterOrders {
    status?: string;
    serviceType?: string;
    name?: string;
    phone?: string;
}
export interface ServiceOrder {
    files: Array<ExternalBlob>;
    serviceType: string;
    name: string;
    instructions: string;
    phone: string;
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
export interface CatalogItemInput {
    stockStatus: string;
    name: string;
    description: string;
    category: string;
    price: string;
    mediaFiles: Array<ExternalBlob>;
    mediaTypes: Array<string>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    _initializeAccessControlWithSecret(token: string): Promise<void>;
    addCatalogItem(input: CatalogItemInput): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCatalogItem(id: bigint): Promise<void>;
    filterOrders(filters: FilterOrders): Promise<Array<OrderRecord>>;
    generateOtp(phone: string): Promise<string>;
    getAllCatalogItems(): Promise<Array<CatalogItem>>;
    getAllShopOrders(): Promise<Array<ShopOrder>>;
    getBusinessInfo(): Promise<BusinessInfo>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCatalogItem(id: bigint): Promise<CatalogItem | null>;
    getCustomerProfile(phone: string): Promise<{
        customerName: string;
        deliveryAddress: string;
    } | null>;
    getInquiries(): Promise<Array<Inquiry>>;
    getMyShopOrders(phone: string): Promise<Array<ShopOrder>>;
    getOrdersByPhone(phone: string): Promise<Array<OrderRecord>>;
    getPublishedCatalogItems(): Promise<Array<CatalogItem>>;
    getUpiSettings(): Promise<UpiSettings | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeShopOrder(phone: string, customerName: string, deliveryMethod: string, deliveryAddress: string, paymentMethod: string, items: Array<ShopOrderItem>, totalAmount: number): Promise<ShopOrder>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCustomerProfile(phone: string, customerName: string, deliveryAddress: string): Promise<void>;
    setBusinessInfo(ownInfo: BusinessInfo): Promise<void>;
    setUpiSettings(upiId: string, qrCodeUrl: string): Promise<void>;
    submitInquiry(name: string, phone: string, message: string): Promise<void>;
    submitOrder(name: string, phone: string, serviceType: string, instructions: string, fileUrl: string): Promise<bigint>;
    submitOrderFull(input: ServiceOrder): Promise<bigint>;
    togglePublishCatalogItem(id: bigint): Promise<void>;
    updateCatalogItem(id: bigint, input: CatalogItemInput): Promise<void>;
    updateOrderStatus(id: bigint, status: string): Promise<void>;
    updateShopOrderStatus(orderId: bigint, status: string): Promise<void>;
    verifyOtp(phone: string, code: string): Promise<boolean>;
}
