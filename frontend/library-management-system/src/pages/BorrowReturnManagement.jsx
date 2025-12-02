import React, { useState, useEffect } from "react";
import { BookOpen, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { bookService, memberService, borrowService } from "../service/axiosConfig";

const BorrowReturnManagement = () => {
  const [activeTab, setActiveTab] = useState("borrow");
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [overdueRecords, setOverdueRecords] = useState([]);

  const [borrowForm, setBorrowForm] = useState({
    userId: "",
    bookId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
  });

  const [returnForm, setReturnForm] = useState({
    borrowRecordId: "",
    returnDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [selectedMember, setSelectedMember] = useState(null);
  const [penaltyInfo, setPenaltyInfo] = useState(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const membersResponse = await memberService.getAllMembers();
      setMembers(membersResponse);

      const booksResponse = await bookService.getAllBooks();
      setBooks(booksResponse.filter(b => b.availableCopies > 0));

      const borrowResponse = await borrowService.getAllBorrowRecords();
      const activeRecords = borrowResponse.filter(
        (r) => r.status === "ISSUED" || r.status === "OVERDUE"
      );
      setBorrowRecords(activeRecords);
      setOverdueRecords(activeRecords.filter((r) => r.status === "OVERDUE"));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selected member & due date
  useEffect(() => {
    if (borrowForm.userId) {
      const member = members.find((m) => m.id === parseInt(borrowForm.userId));
      setSelectedMember(member);
      if (member) {
        const borrowDays = getMembershipBorrowDays(member.membershipPlan);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + borrowDays);
        setBorrowForm((prev) => ({
          ...prev,
          dueDate: dueDate.toISOString().split("T")[0],
        }));
      }
    } else {
      setSelectedMember(null);
    }
  }, [borrowForm.userId, members]);

  const getMembershipBorrowDays = (plan) => {
    const plans = { STANDARD: 14, PREMIUM: 21, GOLD: 30 };
    return plans[plan] || 14;
  };

  const calculatePenalty = (record) => {
    const today = new Date();
    const dueDate = new Date(record.dueDate);
    const overdueDays = Math.max(
      0,
      Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
    );
    const penalty = overdueDays * 5;
    return { overdueDays, penalty };
  };

  const resetForms = () => {
    setBorrowForm({
      userId: "",
      bookId: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      notes: "",
    });
    setReturnForm({
      borrowRecordId: "",
      returnDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setSelectedMember(null);
    setPenaltyInfo(null);
  };

  const handleBorrowBook = async (e) => {
    e.preventDefault();
    if (!selectedMember) return alert("Please select a member");
    if (selectedMember.currentlyBorrowed >= selectedMember.maxBooksAllowed)
      return alert("Member has reached maximum borrowing limit");
    if (selectedMember.accountStatus !== "ACTIVE")
      return alert("Member account is not active");

    try {
      await borrowService.borrowBook(borrowForm);
      alert("Book borrowed successfully!");
      resetForms();
      fetchData();
    } catch (error) {
      console.error("Error borrowing book:", error);
      alert("Failed to borrow book");
    }
  };

  const handleReturnBook = async (e) => {
    e.preventDefault();
    if (!returnForm.borrowRecordId)
      return alert("Please select a borrow record");

    const record = borrowRecords.find(
      (r) => r.id === parseInt(returnForm.borrowRecordId)
    );

    try {
      await borrowService.returnBook(returnForm);
      if (record && record.penaltyAmount > 0) {
        alert(`Book returned. Penalty: ₹${record.penaltyAmount}`);
      } else {
        alert("Book returned successfully!");
      }
      resetForms();
      fetchData();
    } catch (error) {
      console.error("Error returning book:", error);
      alert("Failed to return book");
    }
  };

  // Calculate penalty on selection
  useEffect(() => {
    if (returnForm.borrowRecordId) {
      const record = borrowRecords.find(
        (r) => r.id === parseInt(returnForm.borrowRecordId)
      );
      if (record && record.status === "OVERDUE") {
        setPenaltyInfo(calculatePenalty(record));
      } else setPenaltyInfo(null);
    }
  }, [returnForm.borrowRecordId, borrowRecords]);

  // JSX
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Borrow & Return Management
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Borrowed"
            value={borrowRecords.length}
            icon={<BookOpen size={24} className="text-blue-600" />}
            bg="bg-blue-100"
          />
          <StatCard
            title="Overdue Books"
            value={overdueRecords.length}
            icon={<AlertCircle size={24} className="text-red-600" />}
            bg="bg-red-100"
          />
          <StatCard
            title="Available Books"
            value={books.length}
            icon={<CheckCircle size={24} className="text-green-600" />}
            bg="bg-green-100"
          />
          <StatCard
            title="Total Penalties"
            value={`₹${overdueRecords.reduce(
              (sum, r) => sum + r.penaltyAmount,
              0
            )}`}
            icon={<DollarSign size={24} className="text-yellow-600" />}
            bg="bg-yellow-100"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <TabMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="p-6">
            {activeTab === "borrow" && (
              <BorrowForm
                members={members}
                books={books}
                borrowForm={borrowForm}
                setBorrowForm={setBorrowForm}
                selectedMember={selectedMember}
                handleBorrowBook={handleBorrowBook}
              />
            )}
            {activeTab === "return" && (
              <ReturnForm
                borrowRecords={borrowRecords}
                returnForm={returnForm}
                setReturnForm={setReturnForm}
                penaltyInfo={penaltyInfo}
                handleReturnBook={handleReturnBook}
              />
            )}
            {activeTab === "history" && (
              <BorrowHistory borrowRecords={borrowRecords} />
            )}
            {activeTab === "overdue" && (
              <OverdueBooks
                overdueRecords={overdueRecords}
                setActiveTab={setActiveTab}
                setReturnForm={setReturnForm}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

export default BorrowReturnManagement;
