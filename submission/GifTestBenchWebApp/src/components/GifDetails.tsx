import React, { useState } from "react";
import "./GifDetails.css";

import FileService from "../service/fileService";

interface GifDetailsProps {
    title: string;
    imageUri: string;
    isFeedbackEnabled?: boolean;
}

function GifDetails({ title, imageUri, isFeedbackEnabled = false }: GifDetailsProps) {
    const [caption, setCaption] = useState("");

    async function runModel() {
        const response = await FileService.upload(imageUri);
        setCaption(response.description.caption || "");
    }

    return (
        <div className="gif">

            {/* Caption button */}
            <button onClick={runModel}>Generate Caption</button>

            {/* GIF */}
            <img
                className="marginTop"
                tabIndex={0}
                src={imageUri}
                alt=""
            />

            {/* Caption Output */}
            {caption && (
                <p style={{ marginTop: "8px", fontWeight: "bold" }}>
                    {caption}
                </p>
            )}

            {/* Feedback section*/}
            <div className={isFeedbackEnabled ? "" : "hide-feedback"}>
                <button className="buttons">👍</button>
                <button className="buttons">👎</button>
            </div>
        </div>
    );
}

export default GifDetails;