import { NextApiRequest, NextApiResponse } from 'next';
import { filter } from 'lodash';
import { CartProductStateProps } from 'types/cart';
import { Chance } from 'chance';
const chance = new Chance();
let inCartProduct: CartProductStateProps[];
let newProduct: CartProductStateProps;
let subtotal: number;
let latestProducts: CartProductStateProps[];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { product, products } = req.body;
  newProduct = { ...product!, itemId: chance.timestamp() };
  subtotal = newProduct?.quantity * newProduct.offerPrice;

  inCartProduct = filter(products, {
    id: newProduct.id,
    color: newProduct.color,
    size: newProduct.size
  });
  if (inCartProduct && inCartProduct.length > 0) {
    const newProducts = products.map((item: CartProductStateProps) => {
      if (newProduct?.id === item.id && newProduct?.color === item.color && newProduct.size === item.size) {
        return { ...newProduct, quantity: newProduct.quantity + inCartProduct[0].quantity };
      }
      return item;
    });
    latestProducts = newProducts;
  } else {
    latestProducts = [...products, newProduct];
  }
  return res.status(200).json({ products: latestProducts, subtotal });
}
