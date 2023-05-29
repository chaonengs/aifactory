import { NextApiRequest, NextApiResponse } from 'next';
import { filter } from 'lodash';
import { CartProductStateProps } from 'types/cart';
import { ProductCardProps } from 'types/product';

let oldSubTotal;
let subtotal: number;
let latestProducts: CartProductStateProps[];
let result;
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, quantity, products } = req.body;
  result = filter(products, { itemId: id });
  subtotal = quantity! * result[0].offerPrice;
  oldSubTotal = 0;

  latestProducts = products.map((item: ProductCardProps) => {
    if (id === item.itemId) {
      oldSubTotal = item.quantity * (item.offerPrice || 0);
      return { ...item, quantity: quantity! };
    }
    return item;
  });
  return res.status(200).json({ products: latestProducts, oldSubTotal, subtotal });
}
