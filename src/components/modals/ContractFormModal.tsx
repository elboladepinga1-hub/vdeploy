import { X, Percent } from 'lucide-react';
import { DBPackage } from '../../utils/packagesService';
import { DBCoupon } from '../../utils/couponsService';

type ModalType = 'add-event' | 'edit-event' | 'add-contact' | 'coupons';

interface ContractFormData {
  clientName?: string;
  clientEmail?: string;
  phone?: string;
  clientPhone?: string;
  clientCPF?: string;
  clientRG?: string;
  clientAddress?: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  packageId?: string;
  packageTitle?: string;
  travelFee?: string | number;
  totalAmount?: string | number;
  paymentMethod?: string;
}

interface ContactFormData {
  name: string;
  email?: string;
  phone: string;
  packageId?: string;
  notes?: string;
  eventDate?: string;
  eventTime?: string;
}

interface ContractItem {
  id: string;
  clientName: string;
  clientEmail: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  packageDuration?: string;
  packageTitle?: string;
  paymentMethod?: string;
  depositPaid?: boolean;
  finalPaymentPaid?: boolean;
  depositPaidDate?: string;
  finalPaymentPaidDate?: string;
  eventCompleted?: boolean;
  isEditing?: boolean;
  status?: string;
  pdfUrl?: string | null;
  phone?: string;
  clientPhone?: string;
  clientCPF?: string;
  clientRG?: string;
  clientAddress?: string;
  signatureTime?: string;
  formSnapshot?: any;
  totalAmount?: number;
  travelFee?: number;
  contractDate?: string;
  storeItems?: any[];
  services?: any[];
}

interface ContractFormModalProps {
  modalType: ModalType;
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  packages: DBPackage[];
  coupons: DBCoupon[];
  appliedCoupons: string[];
  setAppliedCoupons: (coupons: string[]) => void;
  isEditMode?: boolean;
  editingEvent?: ContractItem | null;
  editingContactId?: string;
  contactSaving?: boolean;

  // For add/edit event
  formData?: ContractFormData;
  onFormDataChange?: (data: ContractFormData) => void;
  onSave?: () => Promise<void>;

  // For add/edit contact
  contactForm?: ContactFormData;
  onContactFormChange?: (data: ContactFormData) => void;
  onContactSave?: () => Promise<void>;

  // For coupons modal
  selectedEventTotalAmount?: number;
  calculateTotalWithDiscount?: () => number;
  computeTotalFromBase?: (base: number) => number;
}

const ContractFormModal: React.FC<ContractFormModalProps> = ({
  modalType,
  isOpen,
  onClose,
  darkMode = false,
  packages,
  coupons,
  appliedCoupons,
  setAppliedCoupons,
  isEditMode = false,
  editingEvent,
  editingContactId,
  contactSaving = false,
  formData,
  onFormDataChange,
  onSave,
  contactForm,
  onContactFormChange,
  onContactSave,
  selectedEventTotalAmount = 0,
  calculateTotalWithDiscount,
  computeTotalFromBase,
}) => {
  if (!isOpen) return null;

  // Event Form Modal (Add or Edit)
  if ((modalType === 'add-event' || modalType === 'edit-event') && formData && onFormDataChange && onSave) {
    return (
      <div
        className={`fixed inset-0 z-[53] flex items-center justify-center p-4 transition-colors ${
          darkMode ? 'bg-black/70' : 'bg-black/50'
        }`}
        onClick={onClose}
      >
        <div
          className={`rounded-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[80vh] transition-colors ${
            darkMode ? 'bg-black border border-gray-800' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
              {modalType === 'edit-event' ? 'Editar Evento' : 'Crear Evento'}
            </h3>
            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={formData.clientName || ''}
              onChange={(e) => onFormDataChange({ ...formData, clientName: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.clientEmail || ''}
              onChange={(e) => onFormDataChange({ ...formData, clientEmail: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.phone || ''}
              onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />

            <input
              type="text"
              placeholder="CPF"
              value={formData.clientCPF || ''}
              onChange={(e) => onFormDataChange({ ...formData, clientCPF: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="text"
              placeholder="RG"
              value={formData.clientRG || ''}
              onChange={(e) => onFormDataChange({ ...formData, clientRG: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="text"
              placeholder="Dirección"
              value={formData.clientAddress || ''}
              onChange={(e) => onFormDataChange({ ...formData, clientAddress: e.target.value })}
              className={`px-3 py-2 border rounded text-sm md:col-span-2 ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />

            <input
              type="text"
              placeholder="Tipo de evento"
              value={formData.eventType || ''}
              onChange={(e) => onFormDataChange({ ...formData, eventType: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="date"
              value={formData.eventDate || ''}
              onChange={(e) => onFormDataChange({ ...formData, eventDate: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="time"
              value={formData.eventTime || ''}
              onChange={(e) => onFormDataChange({ ...formData, eventTime: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="text"
              placeholder="Ubicación"
              value={formData.eventLocation || ''}
              onChange={(e) => onFormDataChange({ ...formData, eventLocation: e.target.value })}
              className={`px-3 py-2 border rounded text-sm md:col-span-2 ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <select
              value={formData.packageId || ''}
              onChange={(e) => {
                const pkg = packages.find((p) => p.id === e.target.value);
                onFormDataChange({
                  ...formData,
                  packageId: e.target.value,
                  packageTitle: pkg?.title,
                  totalAmount: pkg?.price || formData.totalAmount,
                });
              }}
              className={`px-3 py-2 border rounded text-sm md:col-span-2 ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Seleccionar paquete</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title} - R$ {pkg.price}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Deslocamiento"
              value={formData.travelFee || ''}
              onChange={(e) => onFormDataChange({ ...formData, travelFee: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="text"
              placeholder="Método de pago"
              value={formData.paymentMethod || 'pix'}
              onChange={(e) => onFormDataChange({ ...formData, paymentMethod: e.target.value })}
              className={`px-3 py-2 border rounded text-sm md:col-span-2 ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openCouponModal'))}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded"
            >
              Aplicar Cupones ({appliedCoupons.length})
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded"
            >
              {modalType === 'edit-event' ? 'Guardar' : 'Crear Evento'}
            </button>
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 border rounded ${
                darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Contact Form Modal
  if ((modalType === 'add-contact') && contactForm && onContactFormChange && onContactSave) {
    return (
      <div
        className={`fixed inset-0 z-[53] flex items-center justify-center p-4 transition-colors ${
          darkMode ? 'bg-black/70' : 'bg-black/50'
        }`}
        onClick={onClose}
      >
        <div
          className={`rounded-xl w-full max-w-md p-6 transition-colors ${
            darkMode ? 'bg-black border border-gray-800' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
              {editingContactId ? 'Editar Contacto' : 'Crear Contacto'}
            </h3>
            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={contactForm.name}
              onChange={(e) => onContactFormChange({ ...contactForm, name: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={contactForm.phone}
              onChange={(e) => onContactFormChange({ ...contactForm, phone: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={contactForm.eventDate || ''}
                onChange={(e) => onContactFormChange({ ...contactForm, eventDate: e.target.value })}
                className={`px-3 py-2 border rounded text-sm ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
              <input
                type="time"
                value={contactForm.eventTime || ''}
                onChange={(e) => onContactFormChange({ ...contactForm, eventTime: e.target.value })}
                className={`px-3 py-2 border rounded text-sm ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <select
              value={contactForm.packageId || ''}
              onChange={(e) => onContactFormChange({ ...contactForm, packageId: e.target.value })}
              className={`px-3 py-2 border rounded text-sm ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Paquete de interés</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Observaciones"
              value={contactForm.notes || ''}
              onChange={(e) => onContactFormChange({ ...contactForm, notes: e.target.value })}
              className={`px-3 py-2 border rounded text-sm h-24 ${
                darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onContactSave}
              disabled={contactSaving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {contactSaving ? 'Guardando...' : editingContactId ? 'Guardar cambios' : 'Crear Contacto'}
            </button>
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 border rounded ${
                darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Coupon Modal
  if (modalType === 'coupons') {
    return (
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-colors ${
          darkMode ? 'bg-black/70' : 'bg-black/50'
        }`}
        onClick={onClose}
      >
        <div
          className={`rounded-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[80vh] transition-colors ${
            darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
              Aplicar Cupones de Descuento
            </h3>
            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>

          {coupons.length === 0 ? (
            <p className={`text-sm transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No hay cupones disponibles en este momento.
            </p>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => {
                const isApplied = appliedCoupons.includes(coupon.id);
                const discountAmount = (() => {
                  const baseAmount = selectedEventTotalAmount || 0;
                  if (coupon.discountType === 'percentage') {
                    return baseAmount * ((coupon.discountValue || 0) / 100);
                  } else if (coupon.discountType === 'fixed') {
                    return coupon.discountValue || 0;
                  } else if (coupon.discountType === 'full') {
                    return baseAmount;
                  }
                  return 0;
                })();

                return (
                  <label
                    key={coupon.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isApplied
                        ? darkMode
                          ? 'bg-amber-900/20 border-amber-700'
                          : 'bg-amber-50 border-amber-300'
                        : darkMode
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isApplied}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAppliedCoupons([...appliedCoupons, coupon.id]);
                        } else {
                          setAppliedCoupons(appliedCoupons.filter((id) => id !== coupon.id));
                        }
                      }}
                      className="mt-1 w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
                            {coupon.code}
                          </p>
                          {coupon.description && (
                            <p className={`text-sm transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {coupon.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-medium transition-colors ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            {coupon.discountType === 'percentage' && `${coupon.discountValue}%`}
                            {coupon.discountType === 'fixed' && `R$ ${coupon.discountValue}`}
                            {coupon.discountType === 'full' && '100%'}
                          </p>
                          <p className={`text-xs transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Ahorro: R$ {discountAmount.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className={`mt-6 p-4 rounded-lg border transition-colors ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Monto original:</span>
                <span className={`font-medium transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
                  R$ {Number(selectedEventTotalAmount || 0).toFixed(0)}
                </span>
              </div>
              {appliedCoupons.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Descuento total:</span>
                    <span className={`font-medium transition-colors ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      -R${(Number(selectedEventTotalAmount || 0) - (computeTotalFromBase ? computeTotalFromBase(Number(selectedEventTotalAmount || 0)) : 0)).toFixed(0)}
                    </span>
                  </div>
                  <div className="border-t border-gray-400/20 pt-2 flex justify-between">
                    <span className={`font-medium transition-colors ${darkMode ? 'text-white' : 'text-black'}`}>
                      Total con descuento:
                    </span>
                    <span className={`font-bold transition-colors ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      R$ {(calculateTotalWithDiscount ? calculateTotalWithDiscount() : computeTotalFromBase ? computeTotalFromBase(Number(selectedEventTotalAmount || 0)) : 0).toFixed(0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Aceptar
            </button>
            <button
              onClick={() => {
                setAppliedCoupons([]);
                onClose();
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium border transition-colors ${
                darkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ContractFormModal;
