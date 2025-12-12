const API_BASE = "http://127.0.0.1:8000";

// Always use BLIP endpoint since all models use same endpoint
const BLIP_ENDPOINT = "/caption/blip/url";

export function getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "";
}

async function upload(imageUrl: string) {
    const requestUrl = `${API_BASE}${BLIP_ENDPOINT}?url=${encodeURIComponent(
        imageUrl
    )}`;

    try {
        const response = await fetch(requestUrl, { method: "POST" });
        const json = await response.json();

        return {
            description: {
                caption: json.caption || "",
                runtime_secs: json.runtime_secs || 0
            }
        };
    } catch (err) {
        console.error("upload() error:", err);
        return {
            description: {
                caption: "Error generating caption",
                runtime_secs: 0
            }
        };
    }
}

const FileService = {
    upload,
    getFileExtension
};

export default FileService;