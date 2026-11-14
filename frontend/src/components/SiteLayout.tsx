import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Milk, ShoppingBag, X } from 'lucide-react';
import { isDemoMode, getSettings, placeholderSettings } from '../lib/api';
import { useCart } from '../context/CartContext';
import type { BusinessSettings } from '../types';
import { DemoBanner } from './Primitives';

export function BrandMark({ light = false, businessName = 'DCY DAIRY FARM' }: { light?: boolean; businessName?: string }) {
  const words = businessName.trim().split(/\s+/).filter(Boolean);
  const monogram = words.shift() || 'DCY';
  const descriptor = words.join(' ') || 'DAIRY FARM';
  return <Link className={`brand-mark ${light ? 'brand-mark-light' : ''}`} to="/" aria-label={`${businessName} home`}>
    <span className="brand-icon"><Milk size={22} strokeWidth={1.65} /></span>
    <span className="brand-copy"><strong>{monogram.toUpperCase()}</strong><small>{descriptor.toUpperCase()}</small></span>
  </Link>;
}

export function SiteHeader() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(placeholderSettings);
  const location = useLocation();
  useEffect(() => { getSettings().then(setSettings).catch(() => undefined); }, []);
  useEffect(() => setOpen(false), [location.pathname]);
  const links = [
    { to: '/', label: 'Home' }, { to: '/about', label: 'Our Farm' }, { to: '/shop', label: 'Shop' }, { to: '/contact', label: 'Contact' },
  ];
  return <>
    {isDemoMode && <DemoBanner />}
    <header className="site-header">
      <div className="container header-inner">
        <BrandMark businessName={settings.business_name} />
        <nav className={`main-nav ${open ? 'main-nav-open' : ''}`} aria-label="Main navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>{link.label}</NavLink>)}
          <Link to="/admin/login" className="nav-admin-mobile">Admin sign in <ArrowUpRight size={15} /></Link>
        </nav>
        <div className="header-actions">
          <Link to="/admin/login" className="nav-admin">Admin <ArrowUpRight size={14} /></Link>
          <Link to="/cart" className="cart-link" aria-label={`Shopping bag, ${itemCount} items`}>
            <ShoppingBag size={19} strokeWidth={1.7} /><span>Cart</span>{itemCount > 0 && <b className="cart-count">{itemCount}</b>}
          </Link>
          <button className="mobile-menu-button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
    </header>
  </>;
}

export function SiteFooter() {
  const [settings, setSettings] = useState<BusinessSettings>(placeholderSettings);
  useEffect(() => { getSettings().then(setSettings).catch(() => undefined); }, []);
  return <footer className="site-footer">
    <div className="container footer-main">
      <div className="footer-brand"><BrandMark light businessName={settings.business_name} /><p>{settings.tagline || 'Freshness You Can Trust'}.<br />Dairy essentials, made easy to explore and order.</p></div>
      <div className="footer-column"><h4>Explore</h4><Link to="/shop">Shop all products</Link><Link to="/about">About our farm</Link><Link to="/contact">Get in touch</Link></div>
      <div className="footer-column"><h4>Contact</h4>
        {settings.contact_number ? <a href={`tel:${settings.contact_number}`}>{settings.contact_number}</a> : <span className="footer-placeholder">[Add contact number]</span>}
        {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : <span className="footer-placeholder">[Add business email]</span>}
        {settings.address ? <span>{settings.address}</span> : <span className="footer-placeholder">[Add business address]</span>}
        {Object.keys(settings.social_links || {}).length > 0 && <><h4 className="footer-social-heading">Follow</h4>{Object.entries(settings.social_links).map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}</a>)}</>}
      </div>
      <div className="footer-note"><span className="footer-leaf">✳</span><p>Questions about availability?<br />We’re happy to help you choose.</p><Link to="/contact" className="footer-cta">Send an enquiry <ArrowUpRight size={15} /></Link></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} {settings.business_name || 'DCY DAIRY FARM'}. All rights reserved.</span><span>Prices and availability are confirmed by the farm.</span></div>
  </footer>;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><SiteHeader /><main>{children}</main><SiteFooter /></div>;
}
