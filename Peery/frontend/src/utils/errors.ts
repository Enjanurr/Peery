import axios from 'axios';
import type { ApiErrorBody, ParsedApiError } from '../types/auth.ts';

/** Turns an unknown error into { message, fieldErrors } using the backend's ApiError body. */
export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return { message: 'Cannot reach the server. Is the backend running?', fieldErrors: {} };
    }
    const data = error.response.data;
    return {
      message: data?.message ?? 'Something went wrong. Please try again.',
      fieldErrors: data?.fieldErrors ?? {},
    };
  }
  return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
}