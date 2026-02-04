import React from 'react';

interface LinkifyProps {
    text: string;
}

const Linkify: React.FC<LinkifyProps> = ({ text }) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <>
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sage-green hover:underline break-all"
                            onClick={(e) => e.stopPropagation()} // Prevent map/card click events
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
        </>
    );
};

export default Linkify;
