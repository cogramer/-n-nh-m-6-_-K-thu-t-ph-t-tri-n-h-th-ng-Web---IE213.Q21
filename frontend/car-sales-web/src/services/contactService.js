import api from "./api"; // Shared axios instance

const ContactService = {
  /**
   * [USER] Gửi liên hệ mới
   * API: POST /api/contacts/create
   * @param {Object} contactData - { name, email, phone, subject, message }
   */
  createContact: async (contactData) => {
    const response = await api.post("/contacts/create", contactData);
    return response;
  },

  /**
   * [ADMIN] Lấy toàn bộ danh sách liên hệ khách hàng
   * API: GET /api/contacts/getAll
   * Yêu cầu: Token Admin
   */
  getAllContacts: async () => {
    const response = await api.get("/contacts/getAll");
    return response;
  },

  /**
   * [ADMIN] Xem chi tiết một liên hệ cụ thể
   * API: GET /api/contacts/:id
   * Yêu cầu: Token Admin
   */
  getContactById: async (id) => {
    const response = await api.get(`/contacts/${id}`);
    return response;
  },

  /**
   * [ADMIN] Đánh dấu liên hệ là đã đọc/đã xử lý
   * API: PUT /api/contacts/read/:id
   * Yêu cầu: Token Admin
   */
  markAsRead: async (id) => {
    const response = await api.put(`/contacts/read/${id}`);
    return response;
  },
};

export default ContactService;
