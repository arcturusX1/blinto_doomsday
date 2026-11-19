import { Router } from 'express';
import {
  listMovies,
  getMovie,
  createMovie,
  updateMovie,
  getRewatchOrder,
} from '../controllers/movieController.ts';
import { validateBody } from '../middleware/validate.ts';
import { createMovieSchema, updateMovieSchema } from '../validation/movieSchemas.ts';

const router = Router();

router.route('/').get(listMovies).post(validateBody(createMovieSchema), createMovie);
router.route('/:id').get(getMovie).patch(validateBody(updateMovieSchema), updateMovie);
router.get('/:id/rewatch-order', getRewatchOrder);

export default router;
