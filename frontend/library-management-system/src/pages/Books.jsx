import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, Filter, RefreshCw, X, ArrowLeft } from "lucide-react";
import BookCard from "../components/BookCard";

const Books = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchAllBooks();
  }, []);

  // ---------- Fetch Categories ----------
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("📋 Fetching categories with token:", token ? "Present" : "Missing");
      
      const response = await fetch("http://localhost:1205/librario/api/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      
      console.log("📋 Categories response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📋 Categories data:", data);
      
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Categories error:", error);
      setCategories([]);
    }
  };

  // ---------- Fetch All Books ----------
  const fetchAllBooks = async () => {
    setLoading(true);
    console.log("📚 ========== FETCHING BOOKS ==========");
    
    try {
      const token = localStorage.getItem("token");
      console.log("📚 Token exists:", !!token);
      console.log("📚 Token value:", token?.substring(0, 50) + "...");
      
      const url = "http://localhost:1205/librario/api/books";
      console.log("📚 Request URL:", url);
      
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      console.log("📚 Request headers:", headers);
      
      const response = await fetch(url, {
        method: "GET",
        headers: headers
      });
      
      console.log("📚 Response status:", response.status);
      console.log("📚 Response ok:", response.ok);
      console.log("📚 Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("📚 Error response text:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log("📚 Raw response text:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("📚 JSON parse error:", parseError);
        throw new Error("Invalid JSON response from server");
      }
      
      console.log("📚 Parsed data:", data);
      console.log("📚 Data type:", typeof data);
      console.log("📚 Is array:", Array.isArray(data));
      console.log("📚 Data length:", data?.length);
      
      // Handle different response formats
      let booksData = [];
      
      if (Array.isArray(data)) {
        booksData = data;
        console.log("✅ Format: Direct array");
      } else if (data && Array.isArray(data.content)) {
        booksData = data.content;
        console.log("✅ Format: Paginated (content)");
      } else if (data && Array.isArray(data.data)) {
        booksData = data.data;
        console.log("✅ Format: Wrapped (data)");
      } else if (data && typeof data === 'object') {
        console.log("⚠️ Unknown format. Full data:", JSON.stringify(data, null, 2));
        // Try to find any array in the response
        const keys = Object.keys(data);
        console.log("📚 Response keys:", keys);
        for (const key of keys) {
          if (Array.isArray(data[key])) {
            console.log(`📚 Found array in key '${key}':`, data[key]);
            booksData = data[key];
            break;
          }
        }
      }
      
      console.log("📚 Final books array:", booksData);
      console.log("📚 Books count:", booksData.length);
      
      if (booksData.length > 0) {
        console.log("📚 First book sample:", booksData[0]);
      }
      
      setBooks(booksData);
      setAllBooks(booksData);
      
      if (booksData.length === 0) {
        console.warn("⚠️ No books in response");
        toast.warning("No books found in database");
      } else {
        console.log(`✅ Successfully loaded ${booksData.length} books`);
      }
      
    } catch (error) {
      console.error("📚 ========== FETCH ERROR ==========");
      console.error("❌ Error type:", error.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      
      if (error.message.includes("401")) {
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/login";
        }, 2000);
      } else if (error.message.includes("403")) {
        toast.error("Access denied. Please check your permissions.");
      } else if (error.message.includes("Failed to fetch")) {
        toast.error("Cannot connect to server. Is backend running on port 1205?");
      } else {
        toast.error("Failed to load books: " + error.message);
      }
      
      setBooks([]);
      setAllBooks([]);
    } finally {
      setLoading(false);
      console.log("📚 ========== FETCH COMPLETE ==========");
    }
  };

  // ---------- Filtering ----------
  const filterBooks = (categoryId, available, keyword) => {
    let filtered = [...allBooks];
    
    if (categoryId) {
      filtered = filtered.filter((b) =>
        b.categories?.some((c) => c.id === parseInt(categoryId))
      );
    }
    
    if (available) {
      filtered = filtered.filter((b) => b.availableCopies > 0);
    }
    
    if (keyword) {
      const searchTerm = keyword.toLowerCase().trim();
      filtered = filtered.filter((b) =>
        b.title?.toLowerCase().includes(searchTerm) ||
        b.author?.toLowerCase().includes(searchTerm) ||
        b.isbn?.toLowerCase().includes(searchTerm)
      );
    }
    
    setBooks(filtered);
  };

  const handleSearch = () => {
    filterBooks(selectedCategory, availableOnly, searchKeyword.trim());
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    filterBooks(categoryId, availableOnly, searchKeyword);
  };

  const handleAvailableChange = () => {
    setAvailableOnly(!availableOnly);
    filterBooks(selectedCategory, !availableOnly, searchKeyword);
  };

  const handleClearFilters = () => {
    setSearchKeyword("");
    setSelectedCategory("");
    setAvailableOnly(false);
    setBooks(allBooks);
  };

  const handleRefresh = async () => {
    setSearchKeyword("");
    setSelectedCategory("");
    setAvailableOnly(false);
    await fetchAllBooks();
  };

  // ---------- UI ----------
  return (
    <div className="page-animate">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 style={{ margin: 0 }}>Books Catalog</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
              Browse and borrow books from our collection
            </p>
          </div>
        </div>
        <div className="flex gap-sm">
          <button onClick={handleRefresh} className="btn btn-outline" disabled={loading}>
            <RefreshCw size={18} className={loading ? "spinning" : ""} /> 
            Refresh
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="search-section">
        <div className="search-row">
          <div className="form-input-icon">
            <Search className="form-icon" size={20} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by title, author, or ISBN..."
              className="form-input"
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary">
            <Search size={18} />
            Search
          </button>
        </div>

        <div className="filters-row">
          <div className="flex gap-sm" style={{ alignItems: "center" }}>
            <Filter size={20} style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>Filters:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="form-input"
            style={{ width: "auto", minWidth: "200px" }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={handleAvailableChange}
            />
            <span>Available Only</span>
          </label>

          {(searchKeyword || selectedCategory || availableOnly) && (
            <button
              onClick={handleClearFilters}
              className="btn btn-outline btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Book List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Loading books from database...
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Check console (F12) for progress
          </p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            {allBooks.length === 0 
              ? "📚 No books available in library" 
              : "No books found matching your filters"}
          </p>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
            {allBooks.length === 0 
              ? "Database has books but frontend can't load them. Check console (F12)." 
              : `Showing 0 of ${allBooks.length} total books`}
          </p>
          {(searchKeyword || selectedCategory || availableOnly) && (
            <button
              onClick={handleClearFilters}
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
            >
              <X size={18} />
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-md" style={{ color: "var(--text-secondary)" }}>
            Showing <strong style={{ color: "var(--text-primary)" }}>{books.length}</strong> 
            {allBooks.length !== books.length && ` of ${allBooks.length}`} book{books.length !== 1 ? "s" : ""}
          </div>
          <div className="grid grid-cols-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showActions={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Books;