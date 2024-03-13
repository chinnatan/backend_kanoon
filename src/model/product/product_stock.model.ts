export default class ProductStock {
  id: number;
  productId: number;
  qty: number;
  qtyRemaining: number;

  constructor(
    id: number,
    productId: number,
    qty: number,
    qtyRemaining: number
  ) {
    this.id = id;
    this.productId = productId;
    this.qty = qty;
    this.qtyRemaining = qtyRemaining;
  }
}
