import { PostCall } from "@/services/api-calls";


const cloudinaryUpload = async (file: File) => {
    if (!file) {
        console.error('No file selected.');
        return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    try {
        const response = await PostCall(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, formData);
        return response.secure_url;
    } catch (error) {
        console.error('Error during upload:', error);
        return null;
    }
}

export { cloudinaryUpload };