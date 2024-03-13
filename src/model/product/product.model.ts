export default class Product {
  id: number;
  name: string;
  desc: string;
  image: string;
  price: number;
  qtyRemaining: number;

  constructor(
    id: number,
    name: string,
    desc: string,
    image: string,
    price: number,
    qtyRemaining: number
  ) {
    this.id = id;
    this.name = name;
    this.desc = desc;
    this.image = image;
    this.price = price;
    this.qtyRemaining = qtyRemaining;
  }
}
