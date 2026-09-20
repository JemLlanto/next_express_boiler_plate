// services/auth.ts

import Swal from "sweetalert2";
import { options } from "./auth.service";

const BASE = `${process.env.NEXT_PUBLIC_API_URL}`;
const DEFAULT_TIMEOUT_MS = 15000;

export interface ItemDataProps {
  item_id: number;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface ItemFormDataProps {
  name: string;
  quantity: number | string | null;
  price: number | string | null;
}

export const emptyForm: ItemFormDataProps = {
  name: "",
  quantity: null,
  price: null,
};

export function getChangedFields<T extends object>(
  original: T,
  current: T,
): Partial<T> {
  const changes: Partial<T> = {};

  for (const key in current) {
    if (current[key] !== original[key]) {
      changes[key] = current[key]; // ❌ Error
    }
  }

  return changes;
}

// All in one service for item CRUD operations
export const itemService = async (
  method: string,
  itemId?: number,
  body?: object,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) => {
  // Using AbortController to handle request timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Determine the API route based on the method and itemId
    const apiRoute = itemId ? `item/${itemId}` : `item`;
    // Determine Error Message to be displayed
    const errorMessage =
      method === "POST"
        ? "Item Creation Failed"
        : method === "PATCH" || method === "PUT"
          ? "Item Update Failed"
          : method === "DELETE"
            ? "Item Deletion Failed"
            : method === "GET"
              ? "Fetching Item Failed"
              : "Invalid Method";

    // console.log("body: ", body);
    const response = await fetch(
      `${BASE}/${apiRoute}`,
      options(method, body, controller.signal),
    );
    // console.log("response: ", response.status);

    const data = await response.json();
    // Getting the value of response status
    const status = response.status;
    // console.log("data: ", data, status);
    // Failed API request handling with SweetAlert2 for user feedback
    if (!response.ok) {
      if (status === 401) {
        Swal.fire({
          icon: "error",
          title: errorMessage,
          text:
            `${data.message}, Redirecting to login...` ||
            "Something went wrong. Please try again.",
        }).then(() => {
          setTimeout(() => {
            // Redirect to login page
            window.location.href = "/auth/login";
          }, 1500); // Wait for 1 second before redirecting
        });
      } else {
        // Closing modal to see the error message
        Swal.fire({
          icon: "error",
          title: errorMessage,
          text:
            status === 500
              ? "Something went wrong. Please try again."
              : data.message || "Something went wrong. Please try again.",
        });
      }

      return data;
    }

    return data;
  } catch (err) {
    // Check if the error is due to a timeout
    const isTimeout = err instanceof DOMException && err.name === "AbortError";

    Swal.fire({
      icon: "error",
      title: isTimeout ? "Request Timed Out" : "Network Error",
      text: isTimeout
        ? "The server took too long to respond. Please try again."
        : "Something went wrong. Please try again.",
    });

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
