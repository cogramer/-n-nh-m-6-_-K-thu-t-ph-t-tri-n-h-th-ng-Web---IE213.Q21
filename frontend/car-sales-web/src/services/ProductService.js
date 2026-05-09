import api from "./api";

const ProductService = {
  // Fetch every product for catalogue and admin views.
  getAllProducts: async () => {
    const response = await api.get("/products/getAll");
    return response.data;
  },

  // Pass filter criteria as query parameters, for example /filter?brand=Audi.
  filterProducts: async (params) => {
    const response = await api.get("/products/filter", { params });
    return response.data;
  },

  // Load a single product used by the detail page and edit form.
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Product creation uses FormData because image files are uploaded with the payload.
  createProduct: async (productData) => {
    const response = await api.post("/products/create", productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Product updates reuse FormData so admins can replace hero and gallery images.
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/edit/${id}`, productData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete a product by id from the admin product management page.
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/deleteOne/${id}`);
    return response.data;
  },
};

export default ProductService;
