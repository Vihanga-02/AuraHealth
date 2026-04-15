/**
 * Central API barrel — import named APIs from here.
 *
 * import { authApi, doctorApi } from '../api';
 * import api from '../api';  // raw axios instance
 */
export { authApi, default as authApiDefault } from './authApi';
export { doctorApi, default as doctorApiDefault } from './doctorApi';
export { patientApi, default as patientApiDefault } from './patientApi';
export { appointmentApi, default as appointmentApiDefault } from './appointmentApi';
export { paymentApi, default as paymentApiDefault } from './paymentApi';
export { notificationApi, default as notificationApiDefault } from './notificationApi';
export { telemedicineApi, default as telemedicineApiDefault } from './telemedicineApi';
export { default } from './axios'; // raw axios instance
