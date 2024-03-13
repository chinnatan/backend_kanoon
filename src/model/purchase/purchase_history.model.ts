export default class PurchaseHistory {
  id: number;
  productId: number;
  qty: number;

  constructor(id: number, productId: number, qty: number) {
    this.id = id;
    this.productId = productId;
    this.qty = qty;
  }
}
