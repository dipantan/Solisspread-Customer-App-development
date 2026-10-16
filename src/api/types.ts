/** Minimal DTO types aligned with solis-openapi.json (production SolAssist API). */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'BRANCH_MANAGER'
  | 'SALES_MANAGER'
  | 'ACCOUNTANT'
  | 'SERVICE_MANAGER'
  | 'TECHNICIAN'
  | 'DEALER'
  | 'CUSTOMER';

export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export type OtpPurpose =
  | 'LOGIN'
  | 'REGISTER'
  | 'REGISTRATION'
  | 'RESET_PASSWORD'
  | 'VERIFY_PHONE'
  | 'VERIFY_EMAIL'
  | string;

export interface UserSummary {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  roles: UserRole[];
  status: UserStatus;
  referralCode?: string | null;
  wallets?: { cash: number; coins: number };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

export interface RegisterResult {
  accessToken?: string;
  refreshToken?: string;
  user?: UserSummary;
  status?: UserStatus | string;
  requiresOtp?: boolean;
  resumed?: boolean;
  message?: string;
}

export interface RegistrationStatus {
  status: UserStatus | 'NOT_FOUND' | string;
  fullName?: string;
  phoneNumber?: string;
  email?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  profileCompleted?: boolean;
  canLogin?: boolean;
  message?: string;
}

export interface RegisterPayload {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface LoginPayload {
  identifier: string;
  password?: string;
}

export interface SendOtpPayload {
  identifier: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpPayload {
  identifier: string;
  otpCode: string;
  purpose: OtpPurpose;
}

export interface OtpDispatchResponse {
  success: boolean;
  message: string;
  debugOtp?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: UserSummary;
  message?: string;
}

export interface ProductPrice {
  id: string;
  priceTier: string;
  basePrice: string;
  mrp: string;
  validFrom?: string;
  validUntil?: string | null;
  productId?: string;
  createdAt?: string;
}

export type ProductType =
  | 'SOLAR_PANEL'
  | 'INVERTER'
  | 'BATTERY'
  | 'STRUCTURE'
  | 'CABLE_ACCESSORY'
  | 'COMPLETE_PACKAGE'
  | string;

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  hsnCode?: string;
  gstRatePercent?: string;
  brand?: string | null;
  modelNumber?: string | null;
  wattageRating?: string | null;
  warrantyMonths?: number | null;
  specifications?: Record<string, unknown>;
  images?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  prices?: ProductPrice[];
  packageParents?: unknown[];
}

export interface Category {
  id: string;
  name: string;
  code?: string;
  description?: string;
  level?: string;
  parentCategoryId?: string | null;
  parentSubCategoryId?: string | null;
  imageUrl?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  code?: string;
  description?: string;
  website?: string;
  originCountry?: string | null;
  logoUrl?: string | null;
  status?: string;
}

export interface ServicingBranch {
  id: string;
  code?: string;
  name: string;
  city?: string;
  state?: string;
}

export interface ServiceabilityCheck {
  pinCode: string;
  isServiceable: boolean;
  isDeliveryAvailable: boolean;
  isInstallationAvailable: boolean;
  isAmcAvailable: boolean;
  message: string;
  state?: string;
  district?: string;
  standardDeliveryDays?: number;
  servicingBranch?: ServicingBranch;
}

export interface CartItem {
  id: string;
  productId: string;
  /** Prisma Decimal, serialized as a string. */
  quantity: number | string;
  product?: Product;
}

export interface Cart {
  id: string | null;
  userId?: string | null;
  sessionId?: string | null;
  items: CartItem[];
  createdAt?: string;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  sessionId?: string;
}

export interface UpdateCartItemPayload {
  quantity: number;
  sessionId?: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

/** `address` feeds saved addresses; `street` feeds the invoice PDF. */
export interface ShippingAddress {
  title?: string;
  fullName: string;
  phone: string;
  address: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface CreateOrderPayload {
  items: OrderItemInput[];
  pinCode: string;
  shippingAddress: ShippingAddress;
  customerGstin?: string;
  coinsToRedeem?: number;
  cashWalletToApply?: number;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | string;

export interface OrderItem {
  id: string;
  productId: string;
  quantity: string | number;
  unitPrice: string | number;
  gstRatePercent?: string | number;
  cgstAmount?: string | number;
  sgstAmount?: string | number;
  igstAmount?: string | number;
  totalAmount: string | number;
  product?: Product;
}

export interface PaymentTransaction {
  id: string;
  gateway: 'RAZORPAY' | 'CASH_WALLET' | 'COD' | 'BANK_TRANSFER' | string;
  status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | string;
  amount: string | number;
  gatewayOrderId?: string | null;
  gatewayTxId?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  branchId?: string;
  status: OrderStatus;
  shippingAddress?: Partial<ShippingAddress> & Record<string, unknown>;
  items?: OrderItem[];
  transactions?: PaymentTransaction[];
  invoice?: { id: string; invoiceNumber: string; status?: string } | null;
  subtotal?: string | number;
  discountAmount?: string | number;
  taxAmount?: string | number;
  cgstAmount?: string | number;
  sgstAmount?: string | number;
  igstAmount?: string | number;
  totalAmount?: string | number;
  deliveryTrackingNo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderTrackingStep {
  label: string;
  time: string;
  done: boolean;
  current: boolean;
  description?: string;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryTrackingNo?: string | null;
  estimatedDeliveryDate?: string;
  timeline: OrderTrackingStep[];
}

export interface InitiatePaymentResult {
  success: boolean;
  orderId: string;
  paymentStatus?: string;
  message?: string;
  amount?: number;
  currency?: string;
  gatewayOrderId?: string;
  transactionId?: string;
  keyId?: string;
}

export interface CalculateSolarPayload {
  monthlyElectricityBill: number;
  customerType?: 'Residential' | 'Commercial' | 'Industrial';
  tariffPerKwh?: number;
  dailySunHours?: number;
  roofAreaSqFt?: number;
  sanctionedLoadKw?: number;
  lead?: {
    fullName: string;
    phone: string;
    email?: string;
    state: string;
    city: string;
    pinCode: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export interface SolarEstimate {
  monthlyElectricityBill?: number;
  estimatedMonthlyUnitsKwh?: number;
  recommendedCapacityKw?: number;
  recommendedPanelsCount?: number;
  requiredRoofAreaSqFt?: number;
  isRoofSufficient?: boolean;
  estimatedProjectCost?: number;
  estimatedSubsidy?: number;
  netPayableAmount?: number;
  estimatedDailyUnitsKwh?: number;
  estimatedAnnualUnitsKwh?: number;
  estimatedAnnualSavings?: number;
  estimatedPaybackPeriodYears?: number;
  lifetime25YearsSavings?: number;
  annualCo2ReductionTons?: number;
  [key: string]: unknown;
}

export interface AmcPlan {
  id: string;
  name: string;
  description: string;
  durationMonths: number;
  visitFrequencyMonths: number;
  includesSpares: boolean;
  spareDiscountPercent: number;
  price: number;
}

export interface AmcContract {
  id: string;
  contractNumber?: string;
  planName?: string;
  system?: string;
  validUpto?: string;
  status?: string;
  totalVisitsAllocated?: number;
  visitsCompleted?: number;
  startDate?: string;
  endDate?: string;
  plan?: {
    id?: string;
    name?: string;
    description?: string;
    durationMonths?: number;
    visitFrequencyMonths?: number;
    price?: number | string;
    spareDiscountPercent?: number;
  };
  title?: string;
  amount?: number | string;
  paymentMethod?: string;
  project?: {
    id?: string;
    name?: string;
    address?: string;
    installationAddress?: string;
    projectNumber?: string;
    capacityKw?: number;
    systemType?: string;
    [key: string]: any;
  };
  product?: {
    id?: string;
    name?: string;
  };
  address?: string;
  dockets?: any[];
  [key: string]: unknown;
}

export interface RequestAmcPayload {
  planId?: string;
  projectId?: string;
  productId?: string;
  requestType?: 'NEW' | 'RENEWAL' | 'UPGRADE';
  preferredStartDate?: string;
  systemCapacityKw?: number;
  address?: string;
  notes?: string;
}

export type DocketPriority =
  | 'TIER_1_CRITICAL'
  | 'TIER_2_MODERATE'
  | 'TIER_3_ROUTINE';

export type DocketKind =
  | 'SERVICE_REQUEST'
  | 'SUPPORT_TICKET'
  | 'AMC_VISIT'
  | 'BREAKDOWN';

export interface CreateDocketPayload {
  customerId?: string;
  projectId?: string;
  amcContractId?: string;
  assignedTechnicianId?: string;
  branchId?: string;
  priority: DocketPriority;
  issueCategory: string;
  description: string;
  photos?: string[];
  siteAddress?: string;
  docketKind?: DocketKind;
  subject?: string;
  subCategory?: string;
  relatedTo?: string;
  preferredContact?: string;
  scheduledAt?: string;
}

export interface Docket {
  id: string;
  docketNumber?: string;
  customerId?: string;
  projectId?: string | null;
  amcContractId?: string | null;
  branchId?: string;
  assignedTechnicianId?: string | null;
  priority?: DocketPriority;
  issueCategory?: string;
  description?: string;
  photos?: string[];
  siteAddress?: string | null;
  docketKind?: DocketKind;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CreateAddressPayload {
  title?: string;
  fullName?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface Address {
  id: string;
  title?: string;
  fullName?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
  [key: string]: unknown;
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  alternatePhone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}

export interface InitiatePaymentPayload {
  orderId: string;
  gateway: 'RAZORPAY' | 'CASH_WALLET' | 'COD' | 'BANK_TRANSFER';
}

export interface VerifyPaymentPayload {
  orderId: string;
  gatewayTxId: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
}

export interface ApiErrorBody {
  success?: boolean;
  statusCode?: number;
  message?: string | string[];
  error?: string;
  timestamp?: string;
}
