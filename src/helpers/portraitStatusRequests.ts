// Table redraws can emit the visible rows again. A failed request must wait for Retry.
export class PortraitStatusRequests {
  private pending = new Set<number>();
  private failed = new Set<number>();

  begin(ids: number[]): number[] {
    const next = [...new Set(ids)].filter((id) => !this.pending.has(id) && !this.failed.has(id));
    next.forEach((id) => this.pending.add(id));
    return next;
  }

  fail(ids: number[]): void {
    ids.forEach((id) => this.failed.add(id));
  }
  complete(ids: number[]): void {
    ids.forEach((id) => this.pending.delete(id));
  }
  reset(): void {
    this.pending.clear();
    this.failed.clear();
  }
}
