import { ArrowUpRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatProductPrice } from '../lib/format';
import { isDemoMode } from '../lib/api';
import type { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const productImage = product.image_url || '/images/dairy-selection.jpg';
  return <article className="product-card">
    <Link to={`/products/${product.id}`} className="product-image-link" aria-label={`View ${product.name}`}>
      <div className="product-image-wrap">
        <img className="product-image" src={productImage} alt={product.name} loading="lazy" />
        {product.is_sample && <span className="sample-label">Sample item</span>}
        {!product.image_url && <span className="image-placeholder-label">Illustrative image · add product photo</span>}
        {!product.available && <span className="sold-out-label">Unavailable</span>}
      </div>
    </Link>
    <div className="product-card-body">
      <div className="product-meta"><span>{product.category_name || 'Dairy'}</span><span className={`availability ${product.available ? 'available' : ''}`}><i />{product.available ? 'Available' : 'Unavailable'}</span></div>
      <Link to={`/products/${product.id}`} className="product-name-link"><h3>{product.name}</h3><ArrowUpRight size={16} /></Link>
      <p className="product-description">{product.description}</p>
      <div className="product-card-bottom"><div className="product-price"><strong>{formatProductPrice(product.price)}</strong><span> / {product.unit}</span></div>
        <button className="add-button" disabled={!product.available || product.price === null || (product.is_sample && !isDemoMode)} onClick={() => add(product)} aria-label={`Add ${product.name} to cart`} title="Add to cart"><Plus size={18} /></button>
      </div>
      {product.is_sample && <small className="sample-price-note">Preview placeholder · not a live listing</small>}
    </div>
  </article>;
}
