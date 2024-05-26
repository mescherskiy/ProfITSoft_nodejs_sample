export class ReviewQueryDto {
    movie?: number;
    size?: number;
    from?: number;
      
    constructor(data: ReviewQueryDto) {
      this.movie = data.movie ? Number(data.movie) : undefined;
      this.size = data.size ? Number(data.size) : undefined;
      this.from = data.from ? Number(data.from) : undefined;
    }
  }
  