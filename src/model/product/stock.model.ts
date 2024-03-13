export default class Stock {
  id: number;
  remaining: number;

  constructor(
    id: number,
    remaining: number
  ) {
    this.id = id;
    this.remaining = remaining;
  }
}
