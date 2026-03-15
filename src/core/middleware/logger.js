import morgan from 'morgan';
import { env } from '../env.js';

const format = env.NODE_ENV === 'production' ? 'combined' : 'dev';

export const requestLogger = morgan(format);
