/**
 * Central API barrel — import named APIs from here.
 *
 * import { authApi, doctorApi } from '../api';
 * import api from '../api';  // raw axios instance
 */
export { authApi, default as authApiDefault } from './authApi';
export { doctorApi, default as doctorApiDefault } from './doctorApi';
export { default } from './axios'; // raw axios instance
