import './env.js';
import { pool } from './db.js';

try {
  if (process.env.ALLOW_SAMPLE_DATA !== 'YES') throw new Error('Sample data is opt-in. Set ALLOW_SAMPLE_DATA=YES only in a non-production database.');
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed sample data in production.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const entries = [
      { category: 'Milk', slug: 'milk', name: 'Milk', description: 'Product details to be confirmed by DCY Dairy Farm.', price: null, unit: 'Pack size to be confirmed', image: null, available: false },
      { category: 'Curd', slug: 'curd', name: 'Curd', description: 'Product details to be confirmed by DCY Dairy Farm.', price: null, unit: 'Pack size to be confirmed', image: null, available: false },
      { category: 'Ghee', slug: 'ghee', name: 'Ghee', description: 'Product details to be confirmed by DCY Dairy Farm.', price: null, unit: 'Pack size to be confirmed', image: null, available: false },
      { category: 'Paneer', slug: 'paneer', name: 'Paneer', description: 'Product details to be confirmed by DCY Dairy Farm.', price: null, unit: 'Pack size to be confirmed', image: null, available: false },
    ];
    for (const entry of entries) {
      const category = await client.query<{ id: string }>(`INSERT INTO categories (name, slug) VALUES ($1,$2) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`, [entry.category, entry.slug]);
      await client.query(`INSERT INTO products (name,description,price,unit,category_id,image_url,available,is_sample)
        SELECT $1,$2,$3,$4,$5,$6,$7,TRUE
        WHERE NOT EXISTS (SELECT 1 FROM products WHERE name=$1 AND is_sample=TRUE)`,
        [entry.name, entry.description, entry.price, entry.unit, category.rows[0].id, entry.image, entry.available]);
    }
    await client.query('COMMIT');
    console.log('Unpriced sample placeholders added. Replace them with verified product data before launch.');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
} catch (error) {
  console.error('Sample seed failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally { await pool.end(); }
