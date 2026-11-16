import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { DESTINATION_PORTS } from '../data/seedInventory.ts';
import type { BookingRequest, ExportVehicle } from '../types/autoTrade.ts';
import type { LockedCifQuote, ShippingMethod } from './CifCalculatorSection';

interface ImportInquiryFormProps {
  selectedVehicleForBooking: ExportVehicle | null;
  lockedCif: LockedCifQuote | null;
  prefillNotes: string | null;
  onSubmitBooking: (payload: {
    vehicleId: string | null;
    vehicleTitle: string;
    chassisCode: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    destinationPortId: string;
    destinationPortName: string;
    requestType: BookingRequest['requestType'];
    shippingMethod: ShippingMethod;
    quotedAmountUsd: number;
    notes: string;
  }) => Promise<BookingRequest>;
}

interface FormErrors {
  name?: string;
  email?: string;
  notes?: string;
}

export function ImportInquiryForm({
  selectedVehicleForBooking,
  lockedCif,
  prefillNotes,
  onSubmitBooking,
}: ImportInquiryFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [destinationPortId, setDestinationPortId] = useState(DESTINATION_PORTS[0].id);
  const [requestType, setRequestType] =
    useState<BookingRequest['requestType']>('Book Direct Japan Import');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('RoRo Vessel');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingRequest | null>(null);
  const [copied, setCopied] = useState(false);

  const activePort =
    DESTINATION_PORTS.find((p) => p.id === destinationPortId) ?? DESTINATION_PORTS[0];

  useEffect(() => {
    if (selectedVehicleForBooking) {
      const isBal = selectedVehicleForBooking.transit.dealType === 'balance-release';
      setDestinationPortId(selectedVehicleForBooking.transit.destinationPortId);
      setRequestType(isBal ? 'Claim Port Balance Unit' : 'Book Direct Japan Import');
      setNotes(
        isBal
          ? `Claiming Port Balance-Release unit: ${selectedVehicleForBooking.year} ${selectedVehicleForBooking.makeModel} (${selectedVehicleForBooking.chassisCode}) — Remaining balance $${selectedVehicleForBooking.transit.balanceDueUsd.toLocaleString('en-US')}.`
          : `Booking ${selectedVehicleForBooking.year} ${selectedVehicleForBooking.makeModel} (${selectedVehicleForBooking.chassisCode}) from Japan for import to Caribbean port.`,
      );
      setCreatedBooking(null);
    }
  }, [selectedVehicleForBooking]);

  useEffect(() => {
    if (lockedCif) {
      setDestinationPortId(lockedCif.portId);
      setShippingMethod(lockedCif.shippingMethod);
      setRequestType(
        lockedCif.isBalanceDeal ? 'Claim Port Balance Unit' : 'Book Direct Japan Import',
      );
      setNotes(
        `Booking ${lockedCif.vehicleLabel} (${lockedCif.chassisCode}) via ${lockedCif.shippingMethod} to ${lockedCif.portName}. Estimated CIF / Payable: ${lockedCif.totalPayableFormatted}.`,
      );
      setCreatedBooking(null);
    }
  }, [lockedCif]);

  useEffect(() => {
    if (prefillNotes) {
      setNotes(prefillNotes);
      setCreatedBooking(null);
    }
  }, [prefillNotes]);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Please enter your full name or dealership name.';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailPattern.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address for your proforma invoice.';
    }
    if (notes.trim().length < 10) {
      nextErrors.notes = 'Specify the vehicle model, chassis, or import details.';
    }
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const vehicleTitle = selectedVehicleForBooking
        ? `${selectedVehicleForBooking.year} ${selectedVehicleForBooking.makeModel}`
        : lockedCif
          ? lockedCif.vehicleLabel
          : 'Custom Japan-to-Caribbean Import';

      const chassisCode = selectedVehicleForBooking
        ? selectedVehicleForBooking.chassisCode
        : lockedCif
          ? lockedCif.chassisCode
          : 'Sourcing';

      const quotedAmountUsd = selectedVehicleForBooking
        ? selectedVehicleForBooking.transit.balanceDueUsd
        : lockedCif
          ? lockedCif.totalPayableUsd
          : 0;

      const booking = await onSubmitBooking({
        vehicleId: selectedVehicleForBooking?.id ?? lockedCif?.vehicleId ?? null,
        vehicleTitle,
        chassisCode,
        buyerName: name.trim(),
        buyerEmail: email.trim(),
        buyerPhone: phone.trim(),
        destinationPortId: activePort.id,
        destinationPortName: `${activePort.name}, ${activePort.country}`,
        requestType,
        shippingMethod,
        quotedAmountUsd,
        notes: notes.trim(),
      });
      setCreatedBooking(booking);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save booking right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!createdBooking) return;
    const summary = [
      `CrownWheel Booking Reference: ${createdBooking.id.toUpperCase()}`,
      `Vehicle: ${createdBooking.vehicleTitle} (${createdBooking.chassisCode})`,
      `Buyer: ${createdBooking.buyerName} · ${createdBooking.buyerEmail}`,
      `Port: ${createdBooking.destinationPortName} (${createdBooking.shippingMethod})`,
      `Notes: ${createdBooking.notes}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="inquiry" className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Book Vehicle or Request Import
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              Reserve your car online for Japan-to-Caribbean dispatch.
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Submit your vehicle booking, destination island port, and preferred shipping method.
              Your reservation goes straight to our export desk for proforma invoice and RoRo
              scheduling.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4 text-sm text-slate-600">
              <div>
                <div className="font-medium text-zinc-950">Yokohama Export Desk</div>
                <div>Naka-ku, Yokohama, Kanagawa 231-0002, Japan</div>
              </div>
              <div>
                <div className="font-medium text-zinc-950">Caribbean Desk Email</div>
                <a
                  href="mailto:trade@crownwheel.jp"
                  className="text-blue-900 hover:underline underline-offset-4"
                >
                  trade@crownwheel.jp
                </a>
              </div>
              <div>
                <div className="font-medium text-zinc-950">Primary Caribbean Corridors</div>
                <div>Bahamas · Jamaica · Cayman Islands · Turks & Caicos · St. Lucia</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
            {createdBooking ? (
              <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display text-xl font-semibold text-zinc-950">
                      Booking Confirmed — Ref #{createdBooking.id.toUpperCase()}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Thanks, {createdBooking.buyerName}. Your reservation for{' '}
                      <span className="font-medium text-zinc-950">
                        {createdBooking.vehicleTitle}
                      </span>{' '}
                      has been logged in our dispatch queue. Our export coordinator will email your
                      proforma invoice to{' '}
                      <span className="font-medium text-zinc-950">{createdBooking.buyerEmail}</span>
                      .
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Booking Type</span>
                    <span className="font-medium text-zinc-950">{createdBooking.requestType}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Destination Port</span>
                    <span className="font-medium text-zinc-950 text-right">
                      {createdBooking.destinationPortName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Shipping Mode</span>
                    <span className="font-medium text-zinc-950">{createdBooking.shippingMethod}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-slate-700 leading-relaxed">
                    {createdBooking.notes}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-950 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>{copied ? 'Copied Reference' : 'Copy Booking Receipt'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatedBooking(null)}
                    className="px-4 py-2.5 text-sm font-medium text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Book Another Vehicle
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {submitError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                    {submitError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="inq-name"
                      className="block text-sm font-medium text-zinc-950 mb-1.5"
                    >
                      Your Name or Dealership
                    </label>
                    <input
                      id="inq-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Marcus Rolle / Nassau Auto"
                      aria-invalid={Boolean(errors.name)}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 ${
                        errors.name ? 'border-red-600' : 'border-slate-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="inq-email"
                      className="block text-sm font-medium text-zinc-950 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="inq-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="buyer@company.com"
                      aria-invalid={Boolean(errors.email)}
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 ${
                        errors.email ? 'border-red-600' : 'border-slate-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label
                      htmlFor="inq-phone"
                      className="block text-sm font-medium text-zinc-950 mb-1.5"
                    >
                      WhatsApp / Phone
                    </label>
                    <input
                      id="inq-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 242 555 0142"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="inq-port"
                      className="block text-sm font-medium text-zinc-950 mb-1.5"
                    >
                      Destination Port
                    </label>
                    <select
                      id="inq-port"
                      value={destinationPortId}
                      onChange={(e) => setDestinationPortId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    >
                      {DESTINATION_PORTS.map((port) => (
                        <option key={port.id} value={port.id}>
                          {port.name} ({port.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="inq-type"
                      className="block text-sm font-medium text-zinc-950 mb-1.5"
                    >
                      Booking Type
                    </label>
                    <select
                      id="inq-type"
                      value={requestType}
                      onChange={(e) =>
                        setRequestType(e.target.value as BookingRequest['requestType'])
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    >
                      <option value="Book Direct Japan Import">Book Direct Japan Import</option>
                      <option value="Claim Port Balance Unit">Claim Port Balance Unit</option>
                      <option value="Custom Auction Order">Custom Auction Order</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inq-notes"
                    className="block text-sm font-medium text-zinc-950 mb-1.5"
                  >
                    Vehicle Details & Shipping Instructions
                  </label>
                  <textarea
                    id="inq-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      if (errors.notes) setErrors((prev) => ({ ...prev, notes: undefined }));
                    }}
                    placeholder="Example: Booking 2022 Toyota Corolla Sport for RoRo shipment to Nassau, Bahamas..."
                    aria-invalid={Boolean(errors.notes)}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 ${
                      errors.notes ? 'border-red-600' : 'border-slate-300'
                    }`}
                  />
                  {errors.notes && (
                    <p className="mt-1.5 text-xs text-red-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.notes}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    Reservations appear immediately in our Yokohama dispatch queue.
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-400 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {submitting ? 'Submitting Booking...' : 'Confirm Vehicle Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
