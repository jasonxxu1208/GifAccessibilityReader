import React, { useState } from "react";
import {
    Box,
    Flex,
    Text,
    Input
} from "@chakra-ui/react";

import {
    validateFileSize,
    validateFileType
} from "../service/fileValidatorService";

import FileService from "../service/fileService"; 

function FileUpload() {
    const [uploadFormError, setUploadFormError] = useState<string>("");

    // Handle user selecting file
    const handleFileUpload = async (element: HTMLInputElement) => {
        const fileList = element.files;

        if (!fileList || fileList.length === 0) {
            return;
        }

        const file = fileList[0];

        // Validate file size
        const validSize = await validateFileSize(file.size);
        if (!validSize.isValid) {
            setUploadFormError(validSize.errorMessage);
            return;
        }

        // Validate file type
        const ext = FileService.getFileExtension(file.name); 
        const validType = await validateFileType(ext);
        if (!validType.isValid) {
            setUploadFormError(validType.errorMessage);
            return;
        }

        // Convert file to local URL
        const localUrl = URL.createObjectURL(file);

        const response = await FileService.upload(localUrl);

        console.log("Uploaded file result:", response);

        // Clear input
        element.value = "";

        // Show success message
        setUploadFormError("");
    };

    return (
        <div>
            <Box width="50%" m="100px auto" padding="2" shadow="base">
                <Flex direction="column" alignItems="center" mb="5">
                    <Text fontSize="2xl" mb="4">
                        Upload a File (supported formats: .gif and .mp4 — max 4MB)
                    </Text>

                    {uploadFormError && (
                        <Text mt="5" color="red">
                            {uploadFormError}
                        </Text>
                    )}

                    <Box mt="10" ml="24">
                        <Input
                            type="file"
                            variant="unstyled"
                            onChange={(e: React.SyntheticEvent) =>
                                handleFileUpload(
                                    e.currentTarget as HTMLInputElement
                                )
                            }
                        />
                    </Box>
                </Flex>
            </Box>
        </div>
    );
}

export default FileUpload;