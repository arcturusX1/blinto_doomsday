import { Router } from 'express';
import { listCinemas, createCinema, getBookingQuote } from '../controllers/cinemaController.ts';
import { validateBody, validateQuery } from '../middleware/validate.ts';
import { createCinemaSchema, bookingQuerySchema } from '../validation/cinemaSchemas.ts';

const router = Router();

router.route('/').get(listCinemas).post(validateBody(createCinemaSchema), createCinema);
router.get('/:id/booking', validateQuery(bookingQuerySchema), getBookingQuote);

export default router;
