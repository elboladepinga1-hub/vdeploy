import { ContractItem } from '../components/store/AdminCalendar';

// Función para normalizar datos de un contrato
export const normalizeContractData = (contract: any): ContractItem => {
  const formSnapshot = contract.formSnapshot || {};
  
  return {
    ...contract,
    // Datos principales con fallbacks
    clientName: contract.clientName || formSnapshot.clientName || '',
    clientEmail: contract.clientEmail || formSnapshot.clientEmail || '',
    clientPhone: contract.clientPhone || contract.phone || formSnapshot.phone || '',
    clientCPF: contract.clientCPF || formSnapshot.clientCPF || '',
    clientRG: contract.clientRG || formSnapshot.clientRG || '',
    clientAddress: contract.clientAddress || formSnapshot.clientAddress || '',
    
    // Datos del evento
    eventType: contract.eventType || formSnapshot.eventType || '',
    eventDate: contract.eventDate || formSnapshot.eventDate || '',
    eventTime: contract.eventTime || formSnapshot.eventTime || '',
    eventLocation: contract.eventLocation || formSnapshot.eventLocation || '',
    
    // Datos del paquete
    packageTitle: contract.packageTitle || formSnapshot.packageTitle || '',
    packageDuration: contract.packageDuration || formSnapshot.packageDuration || '',
    
    // Datos financieros
    totalAmount: contract.totalAmount || formSnapshot.totalAmount || 0,
    travelFee: contract.travelFee || formSnapshot.travelFee || 0,
    paymentMethod: contract.paymentMethod || formSnapshot.paymentMethod || '',
    
    // Estado del contrato
    depositPaid: contract.depositPaid ?? false,
    finalPaymentPaid: contract.finalPaymentPaid ?? false,
    eventCompleted: contract.eventCompleted ?? false,
    status: contract.status || 'booked',
    
    // Fechas importantes
    contractDate: contract.contractDate || formSnapshot.contractDate || '',
    signatureTime: contract.signatureTime || formSnapshot.signatureTime || '',
    depositPaidDate: contract.depositPaidDate || '',
    finalPaymentPaidDate: contract.finalPaymentPaidDate || '',
    
    // Items adicionales
    storeItems: contract.storeItems || formSnapshot.storeItems || [],
    services: contract.services || formSnapshot.services || [],
    selectedDresses: contract.selectedDresses || formSnapshot.selectedDresses || [],
    
    // Metadatos
    message: contract.message || formSnapshot.message || '',
    couponCode: contract.couponCode || formSnapshot.couponCode || '',
    createdAt: contract.createdAt || formSnapshot.createdAt || new Date().toISOString(),
  };
};

// Función para obtener el teléfono del cliente con múltiples fallbacks
export const getClientPhone = (contract: ContractItem): string => {
  return contract.clientPhone || 
         contract.phone || 
         (contract as any).client_phone || 
         (contract as any).telefone ||
         (contract.formSnapshot?.phone) ||
         '';
};

// Función para obtener el email del cliente con múltiples fallbacks
export const getClientEmail = (contract: ContractItem): string => {
  return contract.clientEmail || 
         (contract.formSnapshot?.email) ||
         '';
};

// Función para obtener la fecha del evento con múltiples fallbacks
export const getEventDate = (contract: ContractItem): string => {
  if (contract.eventDate) return contract.eventDate;
  if (contract.formSnapshot?.eventDate) return contract.formSnapshot.eventDate;
  
  // Buscar en cartItems indexados
  const cartItems = contract.formSnapshot?.cartItems || [];
  for (let i = 0; i < cartItems.length; i++) {
    const date = contract.formSnapshot?.[`date_${i}`];
    if (date) return date;
  }
  
  return '';
};

// Función para obtener la hora del evento con múltiples fallbacks
export const getEventTime = (contract: ContractItem): string => {
  if (contract.eventTime) return contract.eventTime;
  if (contract.formSnapshot?.eventTime) return contract.formSnapshot.eventTime;
  
  // Buscar en cartItems indexados
  const cartItems = contract.formSnapshot?.cartItems || [];
  for (let i = 0; i < cartItems.length; i++) {
    const time = contract.formSnapshot?.[`time_${i}`];
    if (time) return time;
  }
  
  return '';
};

// Función para obtener la ubicación del evento con múltiples fallbacks
export const getEventLocation = (contract: ContractItem): string => {
  if (contract.eventLocation) return contract.eventLocation;
  if (contract.formSnapshot?.eventLocation) return contract.formSnapshot.eventLocation;
  
  // Buscar en cartItems indexados
  const cartItems = contract.formSnapshot?.cartItems || [];
  for (let i = 0; i < cartItems.length; i++) {
    const location = contract.formSnapshot?.[`eventLocation_${i}`];
    if (location) return location;
  }
  
  return '';
};

// Función para calcular montos con descuentos
export const calculateAmounts = (
  contract: ContractItem,
  coupons: any[] = [],
  customPackagePrice?: number
) => {
  const servicesList = Array.isArray(contract.services) ? contract.services : [];
  let servicesTotal = servicesList.reduce((sum, it: any) => {
    const qty = Number(it.quantity ?? 1);
    const price = Number(String(it.price || '').replace(/[^0-9]/g, ''));
    return sum + (price * qty);
  }, 0);

  // Usar precio personalizado si se proporciona
  if (customPackagePrice !== undefined && customPackagePrice > 0) {
    servicesTotal = Number(customPackagePrice);
  }

  const storeTotal = (Array.isArray(contract.storeItems) ? contract.storeItems : []).reduce(
    (sum, it: any) => sum + (Number(it.price) * Number(it.quantity || 1)), 
    0
  );
  
  const travel = Number(contract.travelFee || 0);
  let totalAmount = Math.round(servicesTotal + storeTotal + travel);

  // Aplicar descuentos de cupones
  let discountAmount = 0;
  if (contract.couponCode) {
    const coupon = coupons.find(cp => cp.code === contract.couponCode);
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round(totalAmount * (coupon.discountValue || 0) / 100);
      } else if (coupon.discountType === 'fixed') {
        discountAmount = Math.round(coupon.discountValue || 0);
      } else if (coupon.discountType === 'full') {
        discountAmount = totalAmount;
      }
    }
  }

  totalAmount = Math.max(0, totalAmount - discountAmount);
  
  let depositAmount = 0;
  if (servicesTotal <= 0 && storeTotal > 0) {
    depositAmount = Math.ceil((storeTotal + travel - discountAmount) * 0.5);
  } else {
    depositAmount = Math.ceil(servicesTotal * 0.2 + storeTotal * 0.5 - discountAmount * 0.5);
  }
  
  depositAmount = Math.max(0, depositAmount);
  const remainingAmount = Math.max(0, Math.round(totalAmount - depositAmount));
  
  return { 
    servicesTotal, 
    storeTotal, 
    travel, 
    totalAmount, 
    depositAmount, 
    remainingAmount, 
    discountAmount 
  };
};

// Función para obtener items del contrato (servicios y productos)
export const getContractItems = (contract: ContractItem) => {
  const services = Array.isArray(contract.services) ? contract.services : [];
  const storeItems = Array.isArray(contract.storeItems) ? contract.storeItems : [];
  
  // También buscar en formSnapshot.cartItems si existe
  const cartItems = contract.formSnapshot?.cartItems || [];
  
  return [...services, ...storeItems, ...cartItems];
};

// Función para obtener vestidos seleccionados
export const getSelectedDresses = (contract: ContractItem): string[] => {
  return contract.selectedDresses || 
         contract.formSnapshot?.selectedDresses || 
         [];
};

// Función para determinar si un contrato es de boda
export const isWeddingPackage = (contract: ContractItem): boolean => {
  const eventType = String(contract.eventType || '').toLowerCase();
  const packageTitle = String(contract.packageTitle || '').toLowerCase();
  const packageDuration = String(contract.packageDuration || '').toLowerCase();

  const weddingKeywords = ['casamiento', 'boda', 'wedding', 'civil', 'matrimonio', 'nupcia'];

  return weddingKeywords.some(keyword =>
    eventType.includes(keyword) ||
    packageTitle.includes(keyword) ||
    packageDuration.includes(keyword)
  );
};

// Función para obtener el color del evento según su estado
export const getEventColor = (contract: ContractItem): string => {
  if (contract.status === 'cancelled') return 'bg-red-500 text-white hover:opacity-90';
  if (contract.status === 'released') return 'bg-gray-200 text-gray-700 hover:opacity-90';
  if (contract.status === 'delivered' || (contract.eventCompleted && contract.finalPaymentPaid)) {
    return 'bg-green-600 text-white hover:opacity-90';
  }
  if (contract.status === 'pending_payment' || contract.depositPaid === false) {
    return 'bg-orange-500 text-white hover:opacity-90';
  }
  if (contract.status === 'pending_approval') return 'bg-yellow-500 text-black hover:opacity-90';
  if (contract.status === 'confirmed' || (contract.depositPaid && !contract.eventCompleted)) {
    return 'bg-blue-600 text-white hover:opacity-90';
  }
  
  // Mejora para eventos de calendario sin estado definido
  if (String(contract.id).startsWith('cal_')) return 'bg-purple-500 text-white hover:opacity-90';
  
  return 'bg-gray-400 text-white hover:opacity-90';
};

// Función para normalizar fechas
export const normalizeDateOnly = (s?: string) => {
  if (!s) return '';
  try {
    if (typeof s !== 'string') s = String(s);
    if (s.includes('T')) return s.split('T')[0];
    if (s.includes(' ')) return s.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    const d = new Date(s);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  } catch (e) {}
  return '';
};

// Función para normalizar horas
export const normalizeTimeOnly = (s?: string) => {
  if (!s) return '';
  try {
    if (typeof s !== 'string') s = String(s);
    if (s.includes('T')) return s.split('T')[1].slice(0,5);
    if (s.includes(' ')) return s.split(' ')[1]?.slice(0,5) || '';
    if (/^\d{2}:\d{2}/.test(s)) return s.slice(0,5);
    const d = new Date(s);
    if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } catch (e) {}
  return '';
};
