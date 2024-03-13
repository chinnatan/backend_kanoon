export default class StockQueue<T> {
    private readonly items: T[] = [];
  
    constructor(private readonly capacity: number) {}
  
    enqueue(item: T): void {
      if (this.items.length === this.capacity) {
        this.items.shift();
      }
      this.items.push(item);
    }
  
    dequeue(): T | undefined {
      return this.items.shift();
    }
  
    peek(): T | undefined {
      return this.items[0];
    }
  
    isEmpty(): boolean {
      return this.items.length === 0;
    }
  
    isFull(): boolean {
      return this.items.length === this.capacity;
    }
  }
  