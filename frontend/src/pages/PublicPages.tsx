import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Check, ChevronDown, Clock3, HeartHandshake, Leaf, Mail, MessageCircle, Milk, Minus, Plus, ShieldCheck, ShoppingBasket, ShoppingCart, Sparkles, Trash2, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Alert, Button, EmptyState, Field, Loading, PageHeading } from '../components/Primitives';
import { useCart } from '../context/CartContext';
import { createEnquiry, createOrder, getCategories, getProduct, getProducts, getSettings, isDemoMode, placeholderSettings } from '../lib/api';
import { formatProductPrice } from '../lib/format';
import type { BusinessSettings, Category, Product } from '../types';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(placeholderSettings);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getProducts().then((items) => setProducts(items.filter((item) => item.available).slice(0, 3))).catch(() => setProducts([])).finally(() => setLoading(false)); }, []);
  useEffect(() => { getSettings().then(setSettings).catch(() => undefined); }, []);
  const taglineWords = (settings.tagline || 'Freshness You Can Trust').trim().split(/\s+/);
  return <>
    <section className="hero">
      <div className="hero-photo" />
      <div className="hero-shade" />
      <div className="container hero-content">
        <span className="hero-kicker"><span className="kicker-line" /> DCY DAIRY FARM <span className="kicker-dot">✳</span></span>
        <h1>{taglineWords.slice(0, 1).join(' ')}<br /><em>{taglineWords.slice(1).join(' ')}</em></h1>
        <p>Dairy essentials for the everyday table. Browse the selection, review the details available and reach the farm directly when you’re ready.</p>
        <div className="hero-buttons"><Link to="/shop" className="button button-light">Shop the selection <ArrowRight size={17} /></Link><Link to="/about" className="hero-text-link">About our farm <ArrowUpRight size={16} /></Link></div>
        <div className="hero-caption"><span className="hero-caption-rule" /><span>A simple promise, made personal.</span></div>
      </div>
      <span className="hero-vertical-label">ILLUSTRATIVE FARM IMAGE · REPLACE WITH APPROVED PHOTOGRAPHY</span>
    </section>

    <section className="intro-strip"><div className="container intro-strip-inner"><div className="intro-stamp"><Leaf size={22} /></div><p><strong>Good dairy should feel simple.</strong> Explore the products, compare the pack sizes and ask us anything.</p><Link to="/contact">Talk to our team <ArrowUpRight size={15} /></Link></div></section>

    <section className="section section-products" id="featured">
      <div className="container">
        <div className="section-heading-row"><div><span className="eyebrow">A PLACE TO BEGIN</span><h2>Everyday dairy,<br /><em>thoughtfully chosen.</em></h2></div><Link to="/shop" className="underlined-link">View all products <ArrowRight size={16} /></Link></div>
        {loading ? <Loading label="Loading products" /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <EmptyState title="No products are available just yet">Items will appear here once the farm confirms their details, prices and availability.</EmptyState>}
        {isDemoMode && <p className="sample-footnote">Preview catalogue only — product details and prices are placeholders, not live offers.</p>}
      </div>
    </section>

    <section className="promise-section">
      <div className="container promise-layout">
        <div className="promise-image"><img src="/images/dairy-selection.jpg" alt="A selection of dairy foods arranged on a cream stone table" loading="lazy" /><span className="image-caption">ILLUSTRATIVE DAIRY PHOTOGRAPHY <i>✳</i> PLACEHOLDER IMAGE</span></div>
        <div className="promise-copy"><span className="eyebrow">THE DCY DIFFERENCE</span><h2>Clear choices.<br /><em>A direct connection.</em></h2><p>Review the details supplied for each listing, including its price when confirmed, and contact the farm with any questions before ordering.</p>
          <div className="promise-points"><div><span><ShoppingBasket size={18} /></span><div><strong>Easy to explore</strong><small>A considered catalogue with the details up front.</small></div></div><div><span><HeartHandshake size={18} /></span><div><strong>Talk to the farm</strong><small>Send an enquiry or continue your order on WhatsApp.</small></div></div></div>
          <Link to="/about" className="text-button">A little more about us <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>

    <section className="quality-band"><div className="container quality-inner"><div className="quality-heading"><span className="eyebrow eyebrow-light">OUR STANDARD</span><h2>Trust starts with<br /><em>being transparent.</em></h2><p>We share verified product details and leave room for a real conversation. Availability and order acceptance are confirmed directly by the business.</p></div><div className="quality-cards"><article><span>01</span><BadgeCheck size={20} /><h3>Clear information</h3><p>Product description, price and unit displayed together.</p></article><article><span>02</span><ShieldCheck size={20} /><h3>Your choice</h3><p>Browse first, add only what you want, and review before sending.</p></article><article><span>03</span><HeartHandshake size={20} /><h3>Human support</h3><p>Ask about products, delivery or availability before confirming.</p></article></div></div></section>

    <section className="contact-cta"><div className="container contact-cta-inner"><div><span className="eyebrow">WE’RE HERE TO HELP</span><h2>Have a question<br /><em>about dairy?</em></h2><p>Send us an enquiry. We’ll get back to you using the contact details you provide.</p></div><Link to="/contact" className="button button-primary">Get in touch <ArrowUpRight size={17} /></Link><span className="cta-decoration">✳</span></div></section>
  </>;
}

export function AboutPage() {
  return <>
    <section className="page-hero page-hero-small"><div className="container"><span className="eyebrow">A LITTLE ABOUT US</span><h1>Good food begins<br /><em>with a good promise.</em></h1><p>DCY Dairy Farm is built around a simple idea: freshness you can trust.</p><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Our farm</span></div></div></section>
    <section className="section about-story"><div className="container about-grid"><div className="about-photo-stack"><img className="about-photo-main" src="/images/farm-hero.jpg" alt="Green pasture in morning light at a dairy farm" /><img className="about-photo-small" src="/images/fresh-milk.jpg" alt="Glass milk bottle and a glass of milk" /><span className="about-photo-note">Illustrative photos · replace with approved farm imagery</span><span className="about-stamp">DCY<br /><small>DAIRY FARM</small></span></div><div className="about-copy"><span className="eyebrow">OUR STORY</span><h2>A farm story,<br /><em>still being written.</em></h2><p>Every dairy business has its own people, place and way of working. We don’t make claims on this page that haven’t been confirmed by the farm.</p><div className="editable-note"><span>Business-editable copy</span><p>[Add a verified introduction: where the farm is based, how it began, and what customers should know about its products.]</p></div><p>Until those details are added, use the product catalogue for current listings and contact the team with specific questions.</p><Link to="/shop" className="text-button">Explore products <ArrowRight size={16} /></Link></div></div></section>
    <section className="values-section"><div className="container"><div className="section-heading centered"><span className="eyebrow">WHAT WE STAND FOR</span><h2>A promise shaped<br /><em>around trust.</em></h2><p>These are suggested brand values. Edit them to match the farm’s own words and practices.</p></div><div className="value-grid"><article><span className="value-icon"><HeartHandshake size={21} /></span><h3>Care</h3><p>Thoughtful choices for the products we offer and the people we serve.</p><small>Suggested brand value</small></article><article><span className="value-icon"><Sparkles size={21} /></span><h3>Clarity</h3><p>Useful product information, clear pricing and no hidden claims.</p><small>Suggested brand value</small></article><article><span className="value-icon"><Leaf size={21} /></span><h3>Trust</h3><p>Honest details that customers can understand and verify.</p><small>Suggested brand value</small></article></div></div></section>
    <section className="mission-section"><div className="container mission-inner"><div><span className="eyebrow eyebrow-light">MISSION &amp; VISION</span><h2>Rooted in care.<br /><em>Open about every detail.</em></h2></div><div className="mission-copy"><p><strong>Draft mission:</strong> Make dairy essentials easy to discover and straightforward to order.</p><p><strong>Draft vision:</strong> Build lasting customer trust through clear information and personal service.</p><small>These draft statements are editable suggestions, not claims about established business policy.</small></div></div></section>
  </>;
}

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true); setError('');
      getProducts({ search, category, sort }).then((items) => { if (active) setProducts(items); })
        .catch((err: Error) => { if (active) { setError(err.message); setProducts([]); } })
        .finally(() => { if (active) setLoading(false); });
    }, 120);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, category, sort]);
  return <div className="shop-page">
    <section className="shop-heading"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Shop</span></div><PageHeading eyebrow="THE DAIRY SELECTION" title="A little goodness for every day." description="Explore the current products. Product details, prices and availability are managed by the farm." /></div></section>
    <section className="container shop-content">
      {isDemoMode && <div className="sample-catalogue-note"><span className="sample-note-icon">✳</span><div><strong>Illustrative preview catalogue</strong><p>Product names, images, availability and INR prices below are examples only—not DCY Dairy Farm’s real offers.</p></div></div>}
      <div className="shop-toolbar"><div className="category-tabs" role="group" aria-label="Filter by product category"><button className={category === 'all' ? 'category-tab active' : 'category-tab'} onClick={() => setCategory('all')}>All products <span>{products.length}</span></button>{categories.map((item) => <button key={item.id} className={category === item.id ? 'category-tab active' : 'category-tab'} onClick={() => setCategory(item.id)}>{item.name}</button>)}</div><div className="shop-controls"><label className="search-field"><span className="sr-only">Search products</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dairy…" /><SearchIcon /></label><label className="sort-field"><span className="sr-only">Sort products</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select><ChevronDown size={15} /></label></div></div>
      {loading ? <Loading label="Finding products" /> : error ? <Alert>{error}</Alert> : products.length ? <div className="product-grid shop-product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="No products found">Try a different search or category, or check back later.</EmptyState>}
      <div className="shop-bottom-note"><Clock3 size={16} /><span>Product availability can change. Please confirm your order directly with DCY Dairy Farm.</span></div>
    </section>
  </div>;
}

function SearchIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }

export function ProductPage() {
  const { id = '' } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  useEffect(() => { setLoading(true); getProduct(id).then(setProduct).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <div className="container product-detail-loading"><Loading label="Loading product" /></div>;
  if (!product) return <div className="container product-detail-loading"><EmptyState title="Product not found">{error || 'This product is no longer available.'}<Link to="/shop" className="text-button">Back to shop <ArrowRight size={16} /></Link></EmptyState></div>;
  const onAdd = () => { if (add(product)) { setAdded(true); window.setTimeout(() => setAdded(false), 1800); } };
  return <section className="container product-detail-section"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><span>{product.name}</span></div><div className="product-detail-grid"><div className="product-detail-image"><img src={product.image_url || '/images/dairy-selection.jpg'} alt={product.name} />{product.is_sample && <span className="sample-label">Sample item</span>}{!product.image_url && <span className="image-placeholder-label">Illustrative image · upload the product photo</span>}</div><div className="product-detail-copy"><span className="eyebrow">{product.category_name || 'DAIRY SELECTION'}</span><h1>{product.name}</h1><p className="product-detail-description">{product.description}</p><div className="detail-price"><strong>{formatProductPrice(product.price)}</strong><span>per {product.unit}</span></div><div className="detail-stock"><i className={product.available ? 'stock-dot' : 'stock-dot stock-dot-off'} />{product.available ? 'Currently listed as available' : 'Currently unavailable'}</div>{product.is_sample && <Alert tone="info">Preview placeholder only. Confirm product details and price before publishing.</Alert>}<Button onClick={onAdd} disabled={!product.available || product.price === null || (product.is_sample && !isDemoMode)} className="detail-add-button">{added ? <><Check size={17} /> Added to cart</> : <><ShoppingCart size={17} /> Add to cart</>}</Button><p className="detail-order-note">Order acceptance, delivery arrangements and final availability are confirmed by the farm.</p><Link to="/shop" className="text-button"><ArrowLeft size={16} /> Back to all products</Link></div></div></section>;
}

export function CartPage() {
  const { lines, subtotal, setQuantity, remove } = useCart();
  const hasUnavailable = lines.some((line) => !line.product.available || line.product.price === null || (line.product.is_sample && !isDemoMode));
  return <section className="container cart-page">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Your cart</span></div>
    <PageHeading eyebrow="YOUR SELECTION" title="Your shopping bag" description="Review your items and quantities before continuing." />
    {!lines.length ? <div className="cart-empty"><EmptyState title="Your cart is taking a rest">Browse the dairy selection and add something to get started.</EmptyState><Link to="/shop" className="button button-primary">Explore products <ArrowRight size={17} /></Link></div> : <div className="cart-layout"><div className="cart-items"><div className="cart-list-heading"><span>Product</span><span>Quantity</span><span>Amount</span></div>{lines.map(({ product, quantity }) => <article className="cart-line" key={product.id}><Link to={`/products/${product.id}`} className="cart-line-image"><img src={product.image_url || '/images/dairy-selection.jpg'} alt="" /></Link><div className="cart-line-product"><Link to={`/products/${product.id}`}><strong>{product.name}</strong></Link><small>{product.unit} · {formatProductPrice(product.price)} per unit</small>{product.is_sample && <small className="sample-inline">Preview placeholder</small>}{!product.available && <small className="unavailable-text">No longer available</small>}{product.is_sample && !isDemoMode && <small className="unavailable-text">Sample data cannot be ordered</small>}<button className="remove-item" onClick={() => remove(product.id)}><Trash2 size={14} /> Remove</button></div><div className="quantity-control"><button onClick={() => setQuantity(product.id, quantity - 1)} aria-label={`Decrease ${product.name} quantity`}><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(product.id, quantity + 1)} aria-label={`Increase ${product.name} quantity`}><Plus size={14} /></button></div><strong className="cart-line-total">{formatProductPrice(product.price === null ? null : product.price * quantity)}</strong></article>)}</div><aside className="cart-summary"><span className="eyebrow">ORDER SUMMARY</span><h2>Almost there.</h2><div className="summary-row"><span>Subtotal</span><strong>{formatProductPrice(subtotal)}</strong></div><div className="summary-row"><span>Delivery</span><span>Confirmed by the farm</span></div><div className="summary-total"><span>Estimated total</span><strong>{formatProductPrice(subtotal)}</strong></div><p>Delivery charges, if any, are confirmed by the business before your order is accepted.</p>{hasUnavailable && <Alert>Remove unavailable items before continuing.</Alert>}<Link to={hasUnavailable ? '/cart' : '/checkout'} className={`button button-primary checkout-button ${hasUnavailable ? 'button-disabled' : ''}`} onClick={(e) => hasUnavailable && e.preventDefault()}>Continue to checkout <ArrowRight size={17} /></Link><Link to="/shop" className="continue-shopping">Continue shopping</Link></aside></div>}
  </section>;
}

interface CustomerFields { name: string; phone: string; address: string; instructions: string }
const emptyCustomer: CustomerFields = { name: '', phone: '', address: '', instructions: '' };

export function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [fields, setFields] = useState(emptyCustomer);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState<{ id: string; whatsappUrl: string; whatsappOpened: boolean } | null>(null);
  const unavailable = lines.some((line) => !line.product.available || line.product.price === null || (line.product.is_sample && !isDemoMode));
  const update = (name: keyof CustomerFields, value: string) => setFields((current) => ({ ...current, [name]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (!lines.length) { setError('Your cart is empty. Add a product before checkout.'); return; }
    if (unavailable) { setError('One or more items are no longer available. Return to your cart to remove them.'); return; }
    const digits = fields.phone.replace(/\D/g, '');
    if (fields.name.trim().length < 2 || fields.address.trim().length < 8 || digits.length < 8 || digits.length > 15) {
      setError('Please enter your name, a valid phone number and a complete delivery address.'); return;
    }
    setBusy(true);
    let whatsappTab: Window | null = null;
    try { whatsappTab = window.open('about:blank', '_blank'); } catch { /* Popups can be blocked by privacy settings or a sandbox. */ }
    try {
      const result = await createOrder({
        customer_name: fields.name.trim(), phone: fields.phone.trim(), address: fields.address.trim(), instructions: fields.instructions.trim(),
        items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
      });
      const opened = Boolean(whatsappTab);
      if (whatsappTab) whatsappTab.location.href = result.whatsappUrl;
      setComplete({ id: result.order.id, whatsappUrl: result.whatsappUrl, whatsappOpened: opened });
      clear();
    } catch (err) {
      if (whatsappTab && !whatsappTab.closed) whatsappTab.close();
      setError(err instanceof Error ? err.message : 'Unable to submit your order. Please try again.');
    } finally { setBusy(false); }
  };
  if (complete) return <section className="container checkout-page"><div className="checkout-success"><span className="success-mark"><Check size={28} /></span><span className="eyebrow">ORDER REQUEST SAVED</span><h1>Thank you, {fields.name.split(' ')[0]}.</h1><p>Your order request <strong>#{complete.id.slice(0, 8).toUpperCase()}</strong> has been recorded. {complete.whatsappOpened ? 'WhatsApp has opened with your order summary.' : 'Continue to WhatsApp to share your order summary with the business.'}</p><Alert tone="info">Opening WhatsApp does not confirm payment or order acceptance. The farm will confirm availability and next steps.</Alert><a className="button button-primary" href={complete.whatsappUrl} target="_blank" rel="noreferrer">Continue to WhatsApp <ArrowUpRight size={17} /></a><Link to="/shop" className="continue-shopping">Back to the shop</Link></div></section>;
  return <section className="container checkout-page"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/cart">Your cart</Link><span>/</span><span>Checkout</span></div><PageHeading eyebrow="WHATSAPP ORDERING" title="A few details, then you’re set." description="Your order request is saved first, then you can share its summary with the farm on WhatsApp." />
    {!lines.length ? <div className="cart-empty"><EmptyState title="There’s nothing to check out">Add products to your cart first.</EmptyState><Link to="/shop" className="button button-primary">Browse products <ArrowRight size={17} /></Link></div> : <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}>
      {error && <Alert>{error}</Alert>}
      {unavailable && <Alert>One or more products in your cart are unavailable. Please return to your cart and remove them.</Alert>}
      <div className="form-section-heading"><span className="step-number">01</span><div><h2>Your details</h2><p>We’ll use these to follow up about your request.</p></div></div>
      <div className="form-grid"><Field label="Full name"><input required autoComplete="name" value={fields.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" minLength={2} maxLength={100} /></Field><Field label="Phone number" hint="Include your country code if you are outside India."><input required type="tel" autoComplete="tel" value={fields.phone} onChange={(e) => update('phone', e.target.value)} placeholder="e.g. +91 98765 43210" maxLength={20} /></Field><Field label="Delivery address" className="field-full"><textarea required autoComplete="street-address" value={fields.address} onChange={(e) => update('address', e.target.value)} placeholder="House / flat, street, area, city and PIN code" rows={3} minLength={8} maxLength={500} /></Field><Field label="Instructions (optional)" className="field-full"><textarea value={fields.instructions} onChange={(e) => update('instructions', e.target.value)} placeholder="Anything the team should know?" rows={2} maxLength={500} /></Field></div>
      <div className="form-section-heading order-review-heading"><span className="step-number">02</span><div><h2>Review your order</h2><p>Final availability and acceptance are confirmed by the business.</p></div></div><div className="checkout-review">{lines.map(({ product, quantity }) => <div className="checkout-review-line" key={product.id}><span><strong>{product.name}</strong><small>{quantity} × {product.unit}</small></span><strong>{formatProductPrice(product.price === null ? null : product.price * quantity)}</strong></div>)}<div className="checkout-review-total"><span>Subtotal</span><strong>{formatProductPrice(subtotal)}</strong></div></div>
      {isDemoMode && <Alert tone="info">Preview mode: submitting is disabled by the API layer. No order will be saved.</Alert>}
      <Button type="submit" disabled={busy || unavailable} className="submit-order-button">{busy ? 'Saving your order…' : <>Save order &amp; open WhatsApp <ArrowUpRight size={17} /></>}</Button><p className="checkout-disclaimer">WhatsApp opening does not confirm payment or order acceptance. The business will contact you to confirm.</p>
    </form><aside className="checkout-aside"><div className="checkout-aside-photo"><img src="/images/fresh-milk.jpg" alt="Illustrative milk bottle on a light stone surface" /><span className="image-placeholder-label">Illustrative image</span></div><span className="eyebrow">YOUR ORDER, YOUR WAY</span><h3>A direct line to the farm.</h3><p>We save your request before opening WhatsApp, so the business can follow up even if you close the chat.</p><div className="checkout-aside-total"><span>Current subtotal</span><strong>{formatProductPrice(subtotal)}</strong></div><small>Delivery fee, if applicable, is confirmed separately.</small></aside></div>}
  </section>;
}

interface EnquiryFields { name: string; email: string; phone: string; subject: string; message: string; website: string }
const emptyEnquiry: EnquiryFields = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

export function ContactPage() {
  const [fields, setFields] = useState(emptyEnquiry);
  const [settings, setSettings] = useState<BusinessSettings>(placeholderSettings);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSettings().then(setSettings).catch(() => undefined); }, []);
  const update = (name: keyof EnquiryFields, value: string) => setFields((current) => ({ ...current, [name]: value }));
  const whatsappDigits = settings.whatsapp_number.replace(/\D/g, '');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess(false);
    try {
      await createEnquiry({ name: fields.name.trim(), email: fields.email.trim(), phone: fields.phone.trim(), subject: fields.subject.trim(), message: fields.message.trim(), website: fields.website });
      setSuccess(true); setFields(emptyEnquiry);
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not send your enquiry. Please try again.'); }
    finally { setBusy(false); }
  };
  return <><section className="page-hero page-hero-contact"><div className="container"><span className="eyebrow">LET’S TALK</span><h1>We’d love to<br /><em>hear from you.</em></h1><p>Questions about products or availability? Send the farm a note.</p><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Contact</span></div></div></section>
    <section className="container contact-content"><div className="contact-aside"><span className="eyebrow">CONTACT {settings.business_name}</span><h2>Real questions<br /><em>deserve real answers.</em></h2><p>Use the form and the business team can get back to you. Contact details below are managed in Admin → Business settings.</p><div className="contact-detail"><span><Milk size={18} /></span><div><strong>Phone</strong>{settings.contact_number ? <a href={`tel:${settings.contact_number}`}>{settings.contact_number}</a> : <small>[Business phone to be configured]</small>}</div></div><div className="contact-detail"><span><MessageCircle size={18} /></span><div><strong>WhatsApp</strong>{whatsappDigits.length >= 8 ? <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">{settings.whatsapp_number}</a> : <small>[Business WhatsApp to be configured]</small>}</div></div><div className="contact-detail"><span><Mail size={18} /></span><div><strong>Email</strong>{settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : <small>[Business email to be configured]</small>}</div></div><div className="contact-detail"><span><Truck size={18} /></span><div><strong>Address</strong><small>{settings.address || '[Business address to be configured]'}</small></div></div><div className="contact-detail"><span><Clock3 size={18} /></span><div><strong>Opening hours</strong><small>{settings.opening_hours || '[Business hours to be configured]'}</small></div></div><img className="contact-small-photo" src="/images/dairy-selection.jpg" alt="Fresh dairy products on a cream surface" /></div>
      <form className="contact-form" onSubmit={submit}><label className="honeypot-field" aria-hidden="true">Leave this field blank<input type="text" name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(e) => update('website', e.target.value)} /></label><div className="contact-form-top"><span className="eyebrow">CUSTOMER ENQUIRY</span><h2>How can we help?</h2><p>Fields marked with * are required.</p></div>{error && <Alert>{error}</Alert>}{success && <Alert tone="success">Your enquiry has been saved. Thank you for getting in touch.</Alert>}{isDemoMode && <Alert tone="info">Preview mode: this form won’t send or store your message until the backend and database are configured.</Alert>}<div className="form-grid"><Field label="Your name *"><input required value={fields.name} onChange={(e) => update('name', e.target.value)} autoComplete="name" placeholder="Name" maxLength={100} /></Field><Field label="Email address *"><input required type="email" value={fields.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" placeholder="you@example.com" maxLength={254} /></Field><Field label="Phone number"><input type="tel" value={fields.phone} onChange={(e) => update('phone', e.target.value)} autoComplete="tel" placeholder="Optional" maxLength={20} /></Field><Field label="Subject *"><input required value={fields.subject} onChange={(e) => update('subject', e.target.value)} placeholder="What is this about?" maxLength={160} /></Field><Field label="Message *" className="field-full"><textarea required rows={5} value={fields.message} onChange={(e) => update('message', e.target.value)} placeholder="Write your message…" minLength={10} maxLength={3000} /></Field></div><Button type="submit" disabled={busy} className="contact-submit">{busy ? 'Sending…' : <>Send enquiry <ArrowRight size={17} /></>}</Button><small className="privacy-note">Your details are used only to respond to your enquiry.</small></form></section></>;
}

export function NotFoundPage() {
  return <section className="container not-found"><span className="eyebrow">404 · PAGE NOT FOUND</span><h1>Looks like the<br /><em>milk’s gone elsewhere.</em></h1><p>The page you’re looking for isn’t here.</p><Link to="/" className="button button-primary">Back to home <ArrowRight size={17} /></Link></section>;
}
