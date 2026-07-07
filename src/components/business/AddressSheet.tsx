import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { COUNTRIES, type Country } from '../ui/PhoneInput';
import AnimatedLocationIcon from '../ui/AnimatedLocationIcon';

export interface Address {
  id: string;
  label: string;
  line: string;
  /** Map coordinates for the address-card preview. Optional for manually
   *  typed addresses — the checkout card falls back to a default center. */
  coords?: { lng: number; lat: number };
}

interface AddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddAddress: (address: Address) => void;
}

const MOCK_LOCATION = {
  he: 'הרצל 45, תל אביב, ישראל',
  en: '45 Herzl St, Tel Aviv, Israel',
  postalCode: '6688101',
  coords: { lng: 34.7706, lat: 32.0632 },
};

/** A Google-Places-style autocomplete prediction. Picking one auto-fills
 *  both the street line and the (otherwise hard-to-remember) postal code. */
interface AddressSuggestion {
  label: string;
  postalCode: string;
}

const MOCK_SUGGESTIONS_HE: AddressSuggestion[] = [
  { label: 'הרצל 1, תל אביב', postalCode: '6688101' },
  { label: 'הרצל 10, תל אביב', postalCode: '6688110' },
  { label: 'הרצל 45, תל אביב', postalCode: '6688145' },
  { label: 'רוטשילד 1, תל אביב', postalCode: '6688201' },
  { label: 'רוטשילד 20, תל אביב', postalCode: '6688220' },
  { label: 'רוטשילד 100, תל אביב', postalCode: '6688300' },
  { label: 'דיזנגוף 50, תל אביב', postalCode: '6433250' },
  { label: 'דיזנגוף 100, תל אביב', postalCode: '6433301' },
  { label: 'בן יהודה 5, תל אביב', postalCode: '6342305' },
  { label: 'בן יהודה 22, תל אביב', postalCode: '6342322' },
  { label: 'ויצמן 3, חיפה', postalCode: '3303103' },
  { label: 'ויצמן 15, חיפה', postalCode: '3303115' },
  { label: 'הנביאים 8, ירושלים', postalCode: '9510208' },
  { label: 'הנביאים 30, ירושלים', postalCode: '9510230' },
  { label: "ז'בוטינסקי 14, רמת גן", postalCode: '5252014' },
  { label: 'בן גוריון 5, נתניה', postalCode: '4220105' },
  { label: 'בן גוריון 20, נתניה', postalCode: '4220120' },
  { label: 'שדרות יצחק רבין 2, פתח תקווה', postalCode: '4951002' },
  { label: 'העצמאות 1, חיפה', postalCode: '3303301' },
  { label: 'שלמה המלך 10, חיפה', postalCode: '3303410' },
];

const MOCK_SUGGESTIONS_EN: AddressSuggestion[] = [
  { label: '1 Herzl St, Tel Aviv', postalCode: '6688101' },
  { label: '10 Herzl St, Tel Aviv', postalCode: '6688110' },
  { label: '45 Herzl St, Tel Aviv', postalCode: '6688145' },
  { label: '1 Rothschild Blvd, Tel Aviv', postalCode: '6688201' },
  { label: '20 Rothschild Blvd, Tel Aviv', postalCode: '6688220' },
  { label: '50 Dizengoff St, Tel Aviv', postalCode: '6433250' },
  { label: '100 Dizengoff St, Tel Aviv', postalCode: '6433301' },
  { label: '5 Ben Yehuda St, Tel Aviv', postalCode: '6342305' },
  { label: '22 Ben Yehuda St, Tel Aviv', postalCode: '6342322' },
  { label: '3 Weizmann St, Haifa', postalCode: '3303103' },
  { label: '15 Weizmann St, Haifa', postalCode: '3303115' },
  { label: "8 Hanevi'im St, Jerusalem", postalCode: '9510208' },
  { label: "30 Hanevi'im St, Jerusalem", postalCode: '9510230' },
  { label: '14 Jabotinsky St, Ramat Gan', postalCode: '5252014' },
  { label: '5 Ben Gurion Blvd, Netanya', postalCode: '4220105' },
  { label: '20 Ben Gurion Blvd, Netanya', postalCode: '4220120' },
];

/** Flag image from flagcdn.com (works on all platforms, no emoji support needed). */
function FlagImg({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-sm object-cover shrink-0"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}

type FormStep = 'suggest' | 'manual' | 'country';

const stepVariants: Variants = {
  enter:  { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } },
};

export default function AddressSheet({
  isOpen,
  onClose,
  addresses,
  selectedId,
  onSelect,
  onAddAddress,
}: AddressSheetProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [adding, setAdding] = useState(false);
  const [formStep, setFormStep] = useState<FormStep>('suggest');
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [suggestionPicked, setSuggestionPicked] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [formStep, adding]);

  const resetForm = useCallback(() => {
    setAdding(false);
    setFormStep('suggest');
    setStreet('');
    setPostalCode('');
    setSuggestionPicked(false);
    setCountrySearch('');
  }, []);

  const handleClose = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(120%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(() => { resetForm(); onClose(); }, 300);
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const header = document.getElementById('address-sheet-header');
    if (!header) return;
    let startY = 0, curY = 0, dragging = false;
    const settle = (toClosed: boolean) => {
      if (toClosed) { handleClose(); return; }
      if (sheetRef.current) { sheetRef.current.style.transition = 'transform 0.3s ease-out'; sheetRef.current.style.transform = 'translateY(0)'; }
      if (overlayRef.current) { overlayRef.current.style.transition = 'opacity 0.3s ease-out'; overlayRef.current.style.opacity = '1'; }
    };
    const onDown = (e: PointerEvent) => {
      // Ignore drags that start on interactive elements (buttons, inputs, etc.)
      if ((e.target as Element).closest('button, input, a')) return;
      dragging = true; startY = e.clientY; curY = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
      try { header.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const onMove = (e: PointerEvent) => { if (!dragging) return; const delta = e.clientY - startY; if (delta > 0) { curY = delta; if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`; if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - delta / 400)); } };
    const onUp = () => { if (!dragging) return; dragging = false; settle(curY > 80); };
    header.addEventListener('pointerdown', onDown);
    header.addEventListener('pointermove', onMove);
    header.addEventListener('pointerup', onUp);
    header.addEventListener('pointercancel', onUp);
    return () => { header.removeEventListener('pointerdown', onDown); header.removeEventListener('pointermove', onMove); header.removeEventListener('pointerup', onUp); header.removeEventListener('pointercancel', onUp); };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const suggestions = (() => {
    if (suggestionPicked || street.length < 2) return [];
    const list = isHe ? MOCK_SUGGESTIONS_HE : MOCK_SUGGESTIONS_EN;
    const q = street.toLowerCase();
    return list.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 5);
  })();

  const pickSuggestion = (s: AddressSuggestion) => {
    setStreet(s.label);
    setPostalCode(s.postalCode);
    setSuggestionPicked(true);
  };

  const handleSaveLocation = () => {
    const id = `addr_${Date.now()}`;
    const base = isHe ? MOCK_LOCATION.he : MOCK_LOCATION.en;
    const line = `${base} (${MOCK_LOCATION.postalCode})`;
    onAddAddress({ id, label: isHe ? 'מיקום נוכחי' : 'Current location', line, coords: MOCK_LOCATION.coords });
    onSelect(id);
    handleClose();
  };

  const handleSaveManual = () => {
    if (!street.trim()) return;
    const id = `addr_${Date.now()}`;
    const countryName = isHe ? country.nameHe : country.name;
    const zip = postalCode.trim();
    const line = `${street.trim()}, ${zip ? `${zip}, ` : ''}${countryName}`;
    onAddAddress({ id, label: street.trim().split(',')[0], line });
    onSelect(id);
    handleClose();
  };

  const handleSelectCountry = (c: Country) => {
    setCountry(c);
    setCountrySearch('');
    setFormStep('manual');
  };

  const handleBack = () => {
    if (formStep === 'country') { setCountrySearch(''); setFormStep('manual'); }
    else if (formStep === 'manual') setFormStep('suggest');
    else setAdding(false);
  };

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = countrySearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.nameHe.includes(q);
  });

  const title = !adding
    ? (isHe ? 'בחירת כתובת משלוח' : 'Choose delivery address')
    : formStep === 'suggest'
      ? (isHe ? 'זיהוי כתובת' : 'Address detection')
      : formStep === 'country'
        ? (isHe ? 'בחירת מדינה' : 'Select country')
        : (isHe ? 'כתובת חדשה' : 'New address');

  // Unique key drives AnimatePresence to re-animate on step change
  const stepKey = adding ? formStep : 'list';

  return createPortal(
    <>
      <div ref={overlayRef} className="fixed inset-0 z-[60] bg-black/40 animate-fade-in" onClick={handleClose} />

      <div className="fixed inset-x-0 bottom-0 z-[60] max-w-md mx-auto px-4 pb-6 pointer-events-none">
        <div
          ref={sheetRef}
          dir={isHe ? 'rtl' : 'ltr'}
          className="pointer-events-auto bg-white rounded-[28px] shadow-2xl max-h-[82vh] flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Drag handle + title */}
          <div id="address-sheet-header" className="flex-shrink-0 select-none px-6 pt-3 pb-4" style={{ touchAction: 'none' }}>
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1.5 bg-border rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              {adding && (
                <button
                  onClick={handleBack}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full active:bg-surface transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 22 }}>
                    {isHe ? 'arrow_forward' : 'arrow_back'}
                  </span>
                </button>
              )}
              <h2 className="text-lg font-bold text-text-primary leading-tight">{title}</h2>
            </div>
          </div>

          {/* Country search bar — slides in/out smoothly */}
          <AnimatePresence>
            {adding && formStep === 'country' && (
              <motion.div
                initial={{ opacity: 0, maxHeight: 0 }}
                animate={{ opacity: 1, maxHeight: 500, transition: { duration: 0.22, ease: 'easeOut' } }}
                exit={{ opacity: 0, maxHeight: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
                className="flex-shrink-0 overflow-hidden px-6 pb-3 border-b border-border/50"
              >
                <div className="flex items-center gap-2 bg-surface rounded-2xl px-3 h-10">
                  <span className="material-symbols-rounded text-text-muted flex-shrink-0" style={{ fontSize: 18 }}>search</span>
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder={isHe ? 'חיפוש מדינה...' : 'Search country...'}
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
                  />
                  {countrySearch.length > 0 && (
                    <button type="button" onClick={() => setCountrySearch('')} className="flex-shrink-0">
                      <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 16 }}>close</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain pb-6 scrollbar-thin">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stepKey}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >

                {/* ── Address list ── */}
                {stepKey === 'list' && (
                  <div className="px-6 pt-2 space-y-1">
                    {addresses.map((addr) => {
                      const active = addr.id === selectedId;
                      return (
                        <button key={addr.id} onClick={() => { onSelect(addr.id); handleClose(); }} className="w-full flex items-center justify-between gap-3 py-3.5 text-start active:bg-surface/70 rounded-xl transition-colors">
                          <span className="flex items-start gap-3 min-w-0">
                            <AnimatedLocationIcon size={22} className="text-text-muted shrink-0" />
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold text-text-primary leading-tight">{addr.label}</span>
                              <span className="block text-[13px] text-text-muted truncate">{addr.line}</span>
                            </span>
                          </span>
                          <span className={`material-symbols-rounded shrink-0 ${active ? 'text-primary' : 'text-transparent'}`} style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </button>
                      );
                    })}
                    <button onClick={() => setAdding(true)} className="w-full flex items-center gap-3 py-3.5 text-start active:bg-surface/70 rounded-xl transition-colors">
                      <span className="material-symbols-rounded text-primary" style={{ fontSize: 22 }}>add_circle</span>
                      <span className="text-[15px] font-semibold text-primary">{isHe ? 'הוספת כתובת חדשה' : 'Add a new address'}</span>
                    </button>
                  </div>
                )}

                {/* ── Location suggestion ── */}
                {stepKey === 'suggest' && (
                  <div className="px-6 pt-2">
                    <p className="text-sm text-text-muted mb-4 leading-relaxed">
                      {isHe ? 'לפי מיקום הטלפון שלך, נראה שהכתובת היא:' : "Based on your phone's location, the address appears to be:"}
                    </p>
                    <div className="bg-surface rounded-2xl p-4 mb-6 flex items-start gap-3">
                      <AnimatedLocationIcon size={24} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-[15px] font-semibold text-text-primary leading-snug">{isHe ? MOCK_LOCATION.he : MOCK_LOCATION.en}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button onClick={handleSaveLocation} className="w-full py-3.5 bg-bg-dark text-white rounded-full font-bold text-base active:scale-[0.98] transition-transform">
                        {isHe ? 'זו הכתובת שלי' : 'This is my address'}
                      </button>
                      <button onClick={() => setFormStep('manual')} className="w-full py-3.5 bg-surface text-text-primary rounded-full font-bold text-base active:scale-[0.98] transition-transform">
                        {isHe ? 'אני רוצה לשנות כתובת' : 'I want to enter a different address'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Manual form ── */}
                {stepKey === 'manual' && (
                  <div className="px-6 pt-2 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1.5">{isHe ? 'מדינה' : 'Country'}</label>
                      <button onClick={() => setFormStep('country')} className="w-full flex items-center gap-3 bg-surface rounded-xl px-4 py-3 active:opacity-70 transition-opacity">
                        <FlagImg code={country.code} size={24} />
                        <span className="flex-1 text-start text-[15px] font-medium text-text-primary">{isHe ? country.nameHe : country.name}</span>
                        <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>expand_more</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1.5">{isHe ? 'שם הרחוב ומספר הבניין' : 'Street name and building number'}</label>
                      <input
                        value={street}
                        onChange={(e) => { setStreet(e.target.value); setSuggestionPicked(false); }}
                        placeholder={isHe ? 'הרצל 45' : '45 Herzl St'}
                        autoComplete="off"
                        className="w-full bg-surface rounded-xl px-4 py-3 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-border"
                      />
                    </div>
                    {suggestions.length > 0 && (
                      <div className="rounded-xl border border-border overflow-hidden -mt-2">
                        {suggestions.map((s) => (
                          <button key={s.label} onMouseDown={() => pickSuggestion(s)} onClick={() => pickSuggestion(s)} className="w-full flex items-center gap-3 px-4 py-3 text-start active:bg-surface transition-colors border-b border-border/40 last:border-0">
                            <AnimatedLocationIcon size={18} className="text-text-muted shrink-0" />
                            <span className="min-w-0">
                              <span className="block text-sm text-text-primary truncate">{s.label}</span>
                              <span className="block text-xs text-text-muted">{isHe ? 'מיקוד' : 'Postal code'} {s.postalCode}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1.5">{isHe ? 'מיקוד' : 'Postal code'}</label>
                      <input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 7))}
                        placeholder={isHe ? 'לדוגמה 6688145' : 'e.g. 6688145'}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        dir="ltr"
                        className={`w-full bg-surface rounded-xl px-4 py-3 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-border ${isHe ? 'text-right' : ''}`}
                      />
                      <p className="text-xs text-text-muted mt-1.5">{isHe ? 'מתמלא אוטומטית כשבוחרים כתובת מההצעות' : 'Auto-filled when you pick a suggested address'}</p>
                    </div>
                    <button onClick={handleSaveManual} disabled={!street.trim()} className="w-full py-3.5 bg-bg-dark text-white rounded-full font-bold text-base active:scale-[0.98] transition-transform disabled:opacity-40">
                      {isHe ? 'שמירה' : 'Save'}
                    </button>
                  </div>
                )}

                {/* ── Country picker — inline within same sheet ── */}
                {stepKey === 'country' && (
                  <div>
                    {filteredCountries.map((c) => {
                      const active = c.code === country.code;
                      return (
                        <button key={c.code} type="button" onClick={() => handleSelectCountry(c)} className={`w-full flex items-center gap-3 px-6 py-3 transition-colors active:bg-surface ${active ? 'bg-primary/5' : ''}`}>
                          <FlagImg code={c.code} size={26} />
                          <span className={`flex-1 text-start text-[15px] font-medium ${active ? 'text-primary' : 'text-text-primary'}`}>
                            {isHe ? c.nameHe : c.name}
                          </span>
                          {active && (
                            <span className="material-symbols-rounded text-primary shrink-0" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          )}
                        </button>
                      );
                    })}
                    {filteredCountries.length === 0 && (
                      <p className="text-center text-sm text-text-muted py-8">{isHe ? 'לא נמצאו תוצאות' : 'No results found'}</p>
                    )}
                    <div className="h-6" />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
