export class ReviewSaveDto {
  title: string;
  text: string;
  movieId: number;
	
  constructor(data: ReviewSaveDto) {
    this.title = data.title;
    this.text = data.text;
    this.movieId = data.movieId;
  }
}
