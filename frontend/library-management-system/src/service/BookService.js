import axios from "./axiosConfig";

const API_URL = "/api/books";

export const bookService = {
  // Get all books - returns array directly
  getAllBooks: async () => {
    try {
      const response = await axios.get(API_URL);
      console.log("BookService - getAllBooks response:", response.data);
      return response.data;
    } catch (error) {
      console.error("BookService - getAllBooks error:", error);
      throw error;
    }
  },

  // Get book by ID
  getBookById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      console.log("BookService - getBookById response:", response.data);
      return response.data;
    } catch (error) {
      console.error("BookService - getBookById error:", error);
      throw error;
    }
  },

  // Search books - can use keyword or full search request
  searchBooks: async (searchParams) => {
    try {
      // If searchParams is a string, treat it as keyword search
      if (typeof searchParams === 'string') {
        const response = await axios.get(`${API_URL}/search`, { 
          params: { keyword: searchParams } 
        });
        console.log("BookService - searchBooks (keyword) response:", response.data);
        return response.data;
      }
      
      // Otherwise, it's a full search request object for pagination
      const response = await axios.post(`${API_URL}/search`, searchParams);
      console.log("BookService - searchBooks (full) response:", response.data);
      return response.data;
    } catch (error) {
      console.error("BookService - searchBooks error:", error);
      throw error;
    }
  },

  // Get available books only
  getAvailableBooks: async () => {
    try {
      const response = await axios.get(`${API_URL}/available`);
      console.log("BookService - getAvailableBooks response:", response.data);
      return response.data;
    } catch (error) {
      console.error("BookService - getAvailableBooks error:", error);
      throw error;
    }
  },

  // Create new book
  createBook: async (bookData) => {
    try {
      const response = await axios.post(API_URL, {
        ...bookData,
        pages: Number(bookData.pages) || 0,
        totalCopies: Number(bookData.totalCopies),
        availableCopies: Number(bookData.availableCopies),
        publishedYear: Number(bookData.publishedYear) || null,
      });
      console.log("BookService - createBook response:", response.data);
      return response.data;
    } catch (error) {
      console.error("BookService - createBook error:", error);
      throw error;
    }
  },

  // Update existing book
  updateBook: async (id, bookData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, {
        ...bookData,
        pages: Number(bookData.pages) || 0,
        totalCopies: Number(bookData.totalCopies),
        availableCopies: Number(bookData.availableCopies),
        publishedYear: Number(bookData.publishedYear) || null,
      });
      console.log("BookService - updateBook response:", response.data);
      return response.data;
    } catch (error) {
      console.error("BookService - updateBook error:", error);
      throw error;
    }
  },

  // Delete book
  deleteBook: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      console.log("BookService - deleteBook response:", response.data);
      return response.data;
    } catch (error) {
      console.error("BookService - deleteBook error:", error);
      throw error;
    }
  },
};