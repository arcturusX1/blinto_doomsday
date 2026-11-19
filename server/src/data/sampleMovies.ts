// Sample data from the assessment brief. Prerequisites are referenced by title
// and every movie is listed after its prerequisites, so it can be inserted in order.
// Release years and runtimes aren't in the brief; they're the theatrical values,
// except Avengers: Doomsday's runtime, which is a placeholder until release.
export interface SampleMovie {
  title: string;
  releaseYear: number;
  runtime: number;
  prereqs: string[];
}

export const sampleMovies: SampleMovie[] = [
  { title: 'Iron Man', releaseYear: 2008, runtime: 126, prereqs: [] },
  { title: 'Captain America: The First Avenger', releaseYear: 2011, runtime: 124, prereqs: [] },
  {
    title: 'The Avengers',
    releaseYear: 2012,
    runtime: 143,
    prereqs: ['Iron Man', 'Captain America: The First Avenger'],
  },
  { title: 'Captain America: Civil War', releaseYear: 2016, runtime: 147, prereqs: ['The Avengers'] },
  { title: 'Thor: Ragnarok', releaseYear: 2017, runtime: 130, prereqs: [] },
  {
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtime: 149,
    prereqs: ['Captain America: Civil War', 'Thor: Ragnarok'],
  },
  { title: 'Avengers: Endgame', releaseYear: 2019, runtime: 181, prereqs: ['Avengers: Infinity War'] },
  { title: 'Avengers: Doomsday', releaseYear: 2026, runtime: 150, prereqs: ['Avengers: Endgame'] },
];
