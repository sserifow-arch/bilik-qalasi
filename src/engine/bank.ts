import type { Question } from '../lib/types';
import general from '../data/questions/general.json';
import azerbaijan from '../data/questions/azerbaijan.json';
import math from '../data/questions/math.json';
import logic from '../data/questions/logic.json';
import colors from '../data/questions/colors.json';
import time from '../data/questions/time.json';
import language from '../data/questions/language.json';

/** Sual bazası (content/questions/*.txt faylından yaradılır) */
export const BANK: Question[] = [general, azerbaijan, math, logic, colors, time, language].flat() as unknown as Question[];
export const BANK_BY_ID: Record<string, Question> = Object.fromEntries(BANK.map((q) => [q.id, q]));
