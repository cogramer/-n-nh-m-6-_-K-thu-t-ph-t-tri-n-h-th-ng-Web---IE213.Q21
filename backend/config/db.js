import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // process.env.MONGODB_URI is loaded from the .env file
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`MongoDB đã kết nối: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Lỗi kết nối: ${error.message}`);
        // Exit with status code 1 when the database connection fails
        process.exit(1);
    }
};

export default connectDB;