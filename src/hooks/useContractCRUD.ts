import { useState } from 'react';
import { addDoc, collection, doc, updateDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import { DBPackage } from '../utils/packagesService';
import { DBCoupon } from '../utils/couponsService';

export interface ContractItem {
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
  status?: 'pending' | 'booked' | 'delivered' | 'cancelled' | 'pending_payment' | 'confirmed' | 'pending_approval' | 'released';
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

interface FormData {
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

interface EditingContactIds {
  contactId?: string;
  calendarEventId?: string;
}

const normalizeDateTime = (v: any): { date: string; time: string } => {
  if (!v) return { date: '', time: '' };
  if (v instanceof Date) {
    const date = `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    const time = `${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`;
    return { date, time };
  }
  const s = String(v);
  if (s.includes('T')) {
    const [date, time] = s.split('T');
    return { date, time: (time || '00:00').slice(0, 5) };
  }
  if (s.includes(' ')) {
    const [date, time] = s.split(' ');
    return { date, time: (time || '00:00').slice(0, 5) };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { date: s, time: '' };
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    return { date, time };
  }
  return { date: s, time: '' };
};

export const useContractCRUD = (
  packages: DBPackage[],
  coupons: DBCoupon[],
  events: ContractItem[],
  load: () => Promise<void>
) => {
  // Add Event Modal States
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [addForm, setAddForm] = useState<FormData>({
    clientName: '',
    clientEmail: '',
    phone: '',
    clientPhone: '',
    clientCPF: '',
    clientRG: '',
    clientAddress: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    packageId: '',
    packageTitle: '',
    travelFee: '',
    totalAmount: '',
    paymentMethod: 'pix',
  });

  // Edit Event Modal States
  const [editingEvent, setEditingEvent] = useState<ContractItem | null>(null);
  const [editForm, setEditForm] = useState<FormData>({});

  // Add Contact Modal States
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    packageId: '',
    notes: '',
    eventDate: '',
    eventTime: '',
  });
  const [editingContactIds, setEditingContactIds] = useState<EditingContactIds | null>(null);
  const [contactSaving, setContactSaving] = useState(false);

  // Coupon States
  const [appliedCoupons, setAppliedCoupons] = useState<string[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Helper functions for discount calculation
  const computeTotalFromBase = (baseAmount: number) => {
    let total = Number(baseAmount || 0);
    appliedCoupons.forEach((couponId) => {
      const coupon = coupons.find((c) => c.id === couponId);
      if (coupon) {
        switch (coupon.discountType) {
          case 'percentage':
            total -= total * ((coupon.discountValue || 0) / 100);
            break;
          case 'fixed':
            total -= coupon.discountValue || 0;
            break;
          case 'full':
            total = 0;
            break;
        }
      }
    });
    return Math.max(0, total);
  };

  const computeDepositFromBase = (base: number) => computeTotalFromBase(base) * 0.2;
  const computeRemainingFromBase = (base: number) => computeTotalFromBase(base) * 0.8;

  const calculateTotalWithDiscount = () => {
    if (!editingEvent) return 0;
    let total = Number(editingEvent.totalAmount || 0);
    appliedCoupons.forEach((couponId) => {
      const coupon = coupons.find((c) => c.id === couponId);
      if (coupon) {
        switch (coupon.discountType) {
          case 'percentage':
            total -= total * ((coupon.discountValue || 0) / 100);
            break;
          case 'fixed':
            total -= coupon.discountValue || 0;
            break;
          case 'full':
            total = 0;
            break;
        }
      }
    });
    return Math.max(0, total);
  };

  const calculateDepositWithDiscount = () => {
    const total = calculateTotalWithDiscount();
    return total * 0.2;
  };

  const calculateRemainingWithDiscount = () => {
    const total = calculateTotalWithDiscount();
    return total * 0.8;
  };

  // Save new event
  const saveNewEvent = async () => {
    try {
      let baseAmount = Number(addForm.totalAmount || 0);
      if (addForm.packageId) {
        const pkg = packages.find((p) => p.id === addForm.packageId);
        if (pkg) baseAmount = Number(pkg.price || baseAmount);
      }

      const totalWithDiscount = computeTotalFromBase(baseAmount);

      const norm = normalizeDateTime(addForm.eventDate || '');
      const payload: any = {
        clientName: addForm.clientName || 'Sin nombre',
        clientEmail: addForm.clientEmail || '',
        clientPhone: addForm.phone || addForm.clientPhone || '',
        phone: addForm.phone || addForm.clientPhone || '',
        clientCPF: addForm.clientCPF || '',
        clientRG: addForm.clientRG || '',
        clientAddress: addForm.clientAddress || '',
        eventType: addForm.eventType || 'Evento',
        eventDate: norm.date || (addForm.eventDate || ''),
        eventTime: norm.time || (addForm.eventTime || '00:00'),
        eventLocation: addForm.eventLocation || '',
        paymentMethod: addForm.paymentMethod || 'pix',
        depositPaid: false,
        finalPaymentPaid: false,
        eventCompleted: false,
        isEditing: false,
        createdAt: new Date().toISOString(),
        totalAmount: Number(totalWithDiscount) || 0,
        travelFee: Number(addForm.travelFee || 0) || 0,
        status: 'booked' as const,
        packageId: addForm.packageId || null,
        packageTitle: addForm.packageTitle || '',
        appliedCoupons: appliedCoupons.slice(),
        formSnapshot: {
          phone: addForm.phone || addForm.clientPhone || '',
          clientPhone: addForm.phone || addForm.clientPhone || '',
          clientCPF: addForm.clientCPF || '',
          clientRG: addForm.clientRG || '',
          clientAddress: addForm.clientAddress || '',
        },
      };

      await addDoc(collection(db, 'contracts'), payload);

      await load();
      setShowAddEventModal(false);
      setAddForm({
        clientName: '',
        clientEmail: '',
        phone: '',
        clientPhone: '',
        clientCPF: '',
        clientRG: '',
        clientAddress: '',
        eventType: '',
        eventDate: '',
        eventTime: '',
        eventLocation: '',
        packageId: '',
        packageTitle: '',
        travelFee: '',
        totalAmount: '',
        paymentMethod: 'pix',
      });
      setAppliedCoupons([]);

      window.dispatchEvent(
        new CustomEvent('contractsUpdated')
      );
      window.dispatchEvent(
        new CustomEvent('adminToast', {
          detail: {
            message: 'Evento creado correctamente',
            type: 'success',
          },
        })
      );
    } catch (e) {
      console.error('Error creating event:', e);
      window.dispatchEvent(
        new CustomEvent('adminToast', {
          detail: {
            message: 'Error al crear el evento',
            type: 'error',
          },
        })
      );
    }
  };

  // Save event changes
  const saveEventChanges = async () => {
    if (!editingEvent) return;

    try {
      const baseId = String(editingEvent.id || '').split('__')[0] || editingEvent.id;
      const updates = {
        clientName: (editForm.clientName ?? editingEvent.clientName ?? '') as any,
        clientEmail: (editForm.clientEmail ?? editingEvent.clientEmail ?? '') as any,
        clientPhone: (editForm.phone ?? editForm.clientPhone ?? editingEvent.clientPhone ?? editingEvent.phone ?? '') as any,
        phone: (editForm.phone ?? editForm.clientPhone ?? editingEvent.phone ?? '') as any,
        clientCPF: (editForm.clientCPF ?? editingEvent.clientCPF ?? '') as any,
        clientRG: (editForm.clientRG ?? editingEvent.clientRG ?? '') as any,
        clientAddress: (editForm.clientAddress ?? editingEvent.clientAddress ?? '') as any,
        eventType: (editForm.eventType ?? editingEvent.eventType ?? '') as any,
        eventDate: (editForm.eventDate ?? editingEvent.eventDate ?? '') as any,
        eventTime: (editForm.eventTime ?? editingEvent.eventTime ?? '') as any,
        eventLocation: (editForm.eventLocation ?? editingEvent.eventLocation ?? '') as any,
        totalAmount: editForm.totalAmount ? Number(editForm.totalAmount) : (editingEvent.totalAmount ?? 0),
        travelFee: editForm.travelFee ? Number(editForm.travelFee) : (editingEvent.travelFee ?? 0),
        paymentMethod: (editForm.paymentMethod ?? editingEvent.paymentMethod ?? 'pix') as any,
        packageTitle: (editForm.packageTitle ?? editingEvent.packageTitle ?? '') as any,
        formSnapshot: {
          ...(editingEvent.formSnapshot || {}),
          phone: (editForm.phone ?? editForm.clientPhone ?? editingEvent.phone ?? (editingEvent.formSnapshot?.phone ?? '') ?? '') as any,
          clientPhone: (editForm.phone ?? editForm.clientPhone ?? editingEvent.clientPhone ?? (editingEvent.formSnapshot?.clientPhone ?? '') ?? '') as any,
          clientCPF: (editForm.clientCPF ?? editingEvent.clientCPF ?? (editingEvent.formSnapshot?.clientCPF ?? '') ?? '') as any,
          clientRG: (editForm.clientRG ?? editingEvent.clientRG ?? (editingEvent.formSnapshot?.clientRG ?? '') ?? '') as any,
          clientAddress: (editForm.clientAddress ?? editingEvent.clientAddress ?? (editingEvent.formSnapshot?.clientAddress ?? '') ?? '') as any,
        },
      };

      await updateDoc(doc(db, 'contracts', baseId), updates);

      const updatedEvents = events.map((e) =>
        e.id === editingEvent.id ? { ...e, ...updates } : e
      );

      await load();
      setEditingEvent(null);
      setEditForm({});
      setAppliedCoupons([]);

      window.dispatchEvent(
        new CustomEvent('contractsUpdated')
      );
      window.dispatchEvent(
        new CustomEvent('adminToast', {
          detail: {
            message: 'Evento actualizado correctamente',
            type: 'success',
          },
        })
      );
    } catch (e) {
      console.error('Error updating event:', e);
      window.dispatchEvent(
        new CustomEvent('adminToast', {
          detail: {
            message: 'Error al actualizar el evento',
            type: 'error',
          },
        })
      );
    }
  };

  // Save new contact
  const saveNewContact = async () => {
    if (contactSaving) return;
    setContactSaving(true);
    try {
      const payload = {
        name: contactForm.name || 'Sin nombre',
        email: contactForm.email || '',
        phone: contactForm.phone || '',
        packageId: contactForm.packageId || null,
        notes: contactForm.notes || '',
        createdAt: new Date().toISOString(),
      };

      if (editingContactIds && editingContactIds.contactId) {
        try {
          await updateDoc(doc(db, 'contacts', editingContactIds.contactId), payload);
        } catch (e) {
          console.error('Error updating contact:', e);
        }

        if (editingContactIds.calendarEventId) {
          try {
            const calPayload: any = {
              name: contactForm.name || 'Contacto',
              email: contactForm.email || '',
              phone: contactForm.phone || '',
              packageId: contactForm.packageId || null,
              packageTitle: packages.find((p) => p.id === contactForm.packageId)?.title || '',
              notes: contactForm.notes || '',
              eventDate: contactForm.eventDate || '',
              eventTime: contactForm.eventTime || '00:00',
              eventLocation: '',
              type: 'contact',
              contactRef: editingContactIds.contactId,
              createdAt: new Date().toISOString(),
            };
            await updateDoc(doc(db, 'calendar_events', editingContactIds.calendarEventId), calPayload);
            await load();
          } catch (e) {
            console.error('Error updating calendar event for contact:', e);
          }
        }

        setEditingContactIds(null);
      } else {
        const contactRef = await addDoc(collection(db, 'contacts'), payload);

        if (contactForm.eventDate) {
          try {
            const csnap = await getDocs(query(collection(db, 'calendar_events')));
            const existing = csnap.docs
              .map((d) => d.data())
              .some(
                (d: any) =>
                  d.contactRef === contactRef.id &&
                  d.eventDate === contactForm.eventDate &&
                  d.eventTime === (contactForm.eventTime || '00:00')
              );
            if (!existing) {
              const calPayload: any = {
                name: contactForm.name || 'Contacto',
                email: contactForm.email || '',
                phone: contactForm.phone || '',
                packageId: contactForm.packageId || null,
                packageTitle: packages.find((p) => p.id === contactForm.packageId)?.title || '',
                notes: contactForm.notes || '',
                eventDate: contactForm.eventDate,
                eventTime: contactForm.eventTime || '00:00',
                eventLocation: '',
                type: 'contact',
                contactRef: contactRef.id,
                createdAt: new Date().toISOString(),
              };
              await addDoc(collection(db, 'calendar_events'), calPayload);
              await load();
            } else {
              console.warn('Duplicate calendar event avoided');
            }
          } catch (e) {
            console.error('Error creating calendar event for contact:', e);
          }
        }
      }

      setShowAddContactModal(false);
      setContactForm({
        name: '',
        email: '',
        phone: '',
        packageId: '',
        notes: '',
        eventDate: '',
        eventTime: '',
      });
      window.dispatchEvent(
        new CustomEvent('adminToast', {
          detail: {
            message: editingContactIds
              ? 'Contacto actualizado correctamente'
              : 'Contacto creado correctamente',
            type: 'success',
          },
        })
      );
      window.dispatchEvent(new CustomEvent('contactsUpdated'));
      window.dispatchEvent(new CustomEvent('calendarUpdated'));
    } catch (e) {
      console.error('Error creating contact:', e);
      window.dispatchEvent(
        new CustomEvent('adminToast', {
          detail: {
            message: 'Error al crear el contacto',
            type: 'error',
          },
        })
      );
    } finally {
      setContactSaving(false);
    }
  };

  return {
    // Event modal states and functions
    showAddEventModal,
    setShowAddEventModal,
    addForm,
    setAddForm,
    saveNewEvent,

    // Edit event states and functions
    editingEvent,
    setEditingEvent,
    editForm,
    setEditForm,
    saveEventChanges,

    // Contact modal states and functions
    showAddContactModal,
    setShowAddContactModal,
    contactForm,
    setContactForm,
    editingContactIds,
    setEditingContactIds,
    contactSaving,
    saveNewContact,

    // Coupon states
    appliedCoupons,
    setAppliedCoupons,
    showCouponModal,
    setShowCouponModal,

    // Helper functions
    computeTotalFromBase,
    computeDepositFromBase,
    computeRemainingFromBase,
    calculateTotalWithDiscount,
    calculateDepositWithDiscount,
    calculateRemainingWithDiscount,
  };
};
