import axios, { AxiosError } from "axios";

const GetCall = async (url: string, headers?: any) => {
    try {
        const result = await axios.get(url, headers);
        return result.data;
    }
    catch (e) {
        console.log("Error in making get api call: ", e);
        return { success: false };
    }
}
const PostCall = async (url: string, payload: any, headers?: any) => {
    try {
        const result = await axios.post(url, payload, headers);
        return result.data;
    }
    catch (e) {
        console.log("Error in making post api call: ", e);
        return { success: false };
    }
}

export { GetCall, PostCall };