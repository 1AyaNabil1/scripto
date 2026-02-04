import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

interface StoryStructuredDataProps {
  story: {
    id: string;
    title: string;
    description: string;
    userName: string;
    genre: string;
    style: string;
    frames: any[];
    createdAt?: string;
    likes?: number;
  };
}

const StoryStructuredData: React.FC<StoryStructuredDataProps> = ({ story }) => {
  // Get the first frame image for preview
  const getFirstFrameImage = () => {
    try {
      let frames = story.frames;
      if (typeof frames === 'string') {
        frames = JSON.parse(frames);
      }
      return frames[0]?.image_url || 'https://Scripto.ashraf.zone/icon.ico';
    } catch {
      return 'https://Scripto.ashraf.zone/icon.ico';
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": story.title,
    "description": story.description,
    "image": getFirstFrameImage(),
    "url": `https://Scripto.ashraf.zone/story/${story.id}`,
    "creator": {
      "@type": "Person",
      "name": story.userName
    },
    "genre": story.genre,
    "artMedium": story.style,
    "dateCreated": story.createdAt,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/LikeAction",
      "userInteractionCount": story.likes || 0
    },
    "publisher": {
      "@type": "Organization",
      "name": "Scripto",
      "url": "https://Scripto.ashraf.zone",
      "logo": {
        "@type": "ImageObject",
        "url": "https://Scripto.ashraf.zone/icon.ico"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://Scripto.ashraf.zone/story/${story.id}`
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default StoryStructuredData;
