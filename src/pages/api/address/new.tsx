import { NextApiRequest, NextApiResponse } from 'next';
import { Chance } from 'chance';
import { Address } from 'components/application/e-commerce/types';
import { v4 as UIDV4 } from 'uuid';
const chance = new Chance();
let address: Address[] = [
  {
    id: 1,
    name: chance.name(),
    destination: 'home',
    building: chance.address({ short_suffix: true }),
    street: chance.address({ short_suffix: false }),
    city: chance.city(),
    state: chance.state({ full: true }),
    country: chance.country({ full: true }),
    post: chance.postcode(),
    phone: chance.phone(),
    isDefault: true
  },
  {
    id: 2,
    name: chance.name(),
    destination: 'office',
    building: chance.address({ short_suffix: true }),
    street: chance.address({ short_suffix: false }),
    city: chance.city(),
    state: chance.state({ full: true }),
    country: chance.country({ full: true }),
    post: chance.postcode(),
    phone: chance.phone(),
    isDefault: false
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, destination, building, street, city, state, country, post, phone, isDefault } = req.body;
  const newAddress = {
    id: UIDV4(),
    name,
    destination,
    building,
    street,
    city,
    state,
    country,
    post,
    phone,
    isDefault
  };

  if (isDefault) {
    address = address.map((item) => {
      if (item.isDefault === true) {
        return { ...item, isDefault: false };
      }
      return item;
    });
  }
  address = [...address, newAddress];
  res.status(200).json({ address });
}
